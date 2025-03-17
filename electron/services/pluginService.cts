import { app, BrowserWindow, IpcMain, IpcRenderer } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { getImagesByIds } from './FileService.cjs';
import { notifyAllWindows } from '../utils/index.cjs';

interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  setup?: (client: AtujiiClient) => void;
}

interface GridItemButtonOptions {
  id?: string;
  name: string;
  [key: string]: any;
}

interface ToolBarItemOptions {
  id?: string;
  name: string;
  [key: string]: any;
}

const ADD_GRID_ITEM_BUTTON = 'add-grid-item-button';
const ADD_TOOL_BAR_ITEM = 'add-tool-bar-item';

// 创建 AtujiiClient 实例
class AtujiiClient {
  private ipcRenderer: IpcRenderer;

  constructor(ipcRenderer: IpcRenderer) {
    this.ipcRenderer = ipcRenderer;
  }

  async addGridItemButton(options: GridItemButtonOptions, callback: (image: any) => void): Promise<void> {
    // 通过 IPC 发送请求到主进程
    const eventId = options.id || options.name;
    notifyAllWindows(ADD_GRID_ITEM_BUTTON, {
      options,
      eventId
    });
    this.ipcRenderer.on(eventId, async (event, ids: string[]) => {
      callback((await getImagesByIds(ids))?.[0]);
    });
  }

  async addToolBarItem(options: ToolBarItemOptions, callback: (images: any[]) => void): Promise<void> {
    const eventId = options.id || options.name;
    notifyAllWindows(ADD_TOOL_BAR_ITEM, {
      options,
      eventId
    });
    this.ipcRenderer.on(eventId, async (event, ids: string[]) => {
      callback(await getImagesByIds(ids));
    });
  }
}

class PluginManager {
  private plugins: Map<string, Plugin>;
  private pluginsPath: string;
  private atujiiClient: AtujiiClient | null;

  constructor() {
    this.plugins = new Map();
    const isDev = !app.isPackaged;
    this.pluginsPath = isDev ? path.join(__dirname, '../../plugins') : path.join(process.resourcesPath, 'plugins');
    this.atujiiClient = null;
  }

  async initializeAndSetupIPC(ipcMain: IpcMain): Promise<void> {
    this.atujiiClient = new AtujiiClient(ipcMain as unknown as IpcRenderer);
    // 初始化插件目录
    await this.initialize();
    // 加载插件
    await this.loadPlugins();

    // 注册插件相关的 IPC 处理器
    ipcMain.handle('get-plugins', () => {
      return this.getPlugins(); // 现在只返回可序列化的数据
    });

    ipcMain.handle('plugin-setup', (event, pluginId: string) => {
      const plugin = this.getPlugin(pluginId);
      if (plugin && this.atujiiClient) {
        plugin.setup?.(this.atujiiClient);
      }
    });
  }

  private async initialize(): Promise<void> {
    if (!fs.existsSync(this.pluginsPath)) {
      await fs.promises.mkdir(this.pluginsPath, { recursive: true });
    }
  }

  // 加载插件
  private async loadPlugins(): Promise<void> {
    try {
      console.log('加载插件目录:', this.pluginsPath);
      const files = await fs.promises.readdir(this.pluginsPath);
      for (const file of files) {
        if (file.endsWith('.cjs')) {
          const pluginPath = path.join(this.pluginsPath, file);
          try {
            const plugin = require(pluginPath) as Plugin;
            if (this.validatePlugin(plugin)) {
              this.plugins.set(plugin.id, plugin);
              // 发送事件通知渲染进程初始化插件
              this.initializePlugin(plugin);
              console.log(`插件加载成功: ${plugin.name}`);
            }
          } catch (error) {
            console.error(`加载插件失败 ${file}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('加载插件目录失败:', error);
    }
  }

  // 验证插件格式
  private validatePlugin(plugin: Plugin): boolean {
    const requiredFields: Array<keyof Plugin> = ['id', 'name', 'version', 'description'];
    return requiredFields.every(field => plugin[field]);
  }

  // 获取所有已加载的插件的可序列化信息
  getPlugins(): Omit<Plugin, 'setup'>[] {
    return Array.from(this.plugins.values()).map(plugin => ({
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      description: plugin.description
    }));
  }

  // 根据 ID 获取完整的插件（包含 setup 函数）
  getPluginSetup(id: string): ((client: AtujiiClient) => void) | undefined {
    const plugin = this.plugins.get(id);
    return plugin?.setup;
  }

  // 获取特定插件
  getPlugin(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }

  // 初始化单个插件
  private initializePlugin(plugin: Plugin): void {
    notifyAllWindows('initialize-plugin', plugin);
  }
}

// 导出单例实例
export = new PluginManager(); 