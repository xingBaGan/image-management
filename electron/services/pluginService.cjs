const fs = require('fs');
const path = require('path');
const { app, BrowserWindow } = require('electron');


function notifyAllWindows(name, data) {
  const windows = BrowserWindow.getAllWindows();
  windows.forEach(window => {
    window.webContents.send(name, data);
  });
}
const ADD_GRID_ITEM_BUTTON = 'add-grid-item-button';
const ADD_TOOL_BAR_ITEM = 'add-tool-bar-item';
// 创建 AtujiiClient 实例
class AtujiiClient {
  constructor(ipcRenderer) {
    this.ipcRenderer = ipcRenderer;
  }

  async addGridItemButton(options, callback) {
    // 通过 IPC 发送请求到主进程
    notifyAllWindows(ADD_GRID_ITEM_BUTTON, options);
  }

  async addToolBarItem(options, callback) {
    notifyAllWindows(ADD_TOOL_BAR_ITEM, options);
  }
}

class PluginManager {
  constructor() {
    this.plugins = new Map();
    const isDev = !app.isPackaged;
    this.pluginsPath = isDev ? path.join(__dirname, '../../plugins') : path.join(process.resourcesPath, 'plugins');
  }
  async initializeAndSetupIPC(ipcMain) {
    this.atujiiClient = new AtujiiClient(ipcMain);
    // 初始化插件目录
    await this.initialize();
    // 加载插件
    await this.loadPlugins();

    // 注册插件相关的 IPC 处理器
    ipcMain.handle('get-plugins', () => {
      return this.getPlugins(); // 现在只返回可序列化的数据
    });

    ipcMain.handle('plugin-setup', (event, pluginId) => {
      const plugin = this.getPlugin(pluginId);
      if (plugin) {
        plugin.setup(this.atujiiClient);
      }
    });
  }

  async initialize() {
    if (!fs.existsSync(this.pluginsPath)) {
      await fs.promises.mkdir(this.pluginsPath, { recursive: true });
    }
  }

  // 加载插件
  async loadPlugins() {
    try {
      console.log('加载插件目录:', this.pluginsPath);
      const files = await fs.promises.readdir(this.pluginsPath);
      for (const file of files) {
        if (file.endsWith('.cjs')) {
          const pluginPath = path.join(this.pluginsPath, file);
          try {
            const plugin = require(pluginPath);
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
  validatePlugin(plugin) {
    const requiredFields = ['id', 'name', 'version', 'description'];
    return requiredFields.every(field => plugin[field]);
  }

  // 获取所有已加载的插件的可序列化信息
  getPlugins() {
    return Array.from(this.plugins.values()).map(plugin => ({
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      description: plugin.description
      // 不返回 setup 函数
    }));
  }

  // 根据 ID 获取完整的插件（包含 setup 函数）
  getPluginSetup(id) {
    const plugin = this.plugins.get(id);
    return plugin?.setup;
  }

  // 获取特定插件
  // 根据id获取插件
  getPlugin(id) {
    return this.plugins.get(id);
  }

  // 初始化单个插件
  initializePlugin(plugin) {
    notifyAllWindows('initialize-plugin', plugin);
  }
}

module.exports = new PluginManager(); 