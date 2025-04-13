import { AppendButtonsProps } from '../types/index.ts';

const ADD_GRID_ITEM_BUTTON = 'add-grid-item-button';
const ADD_TOOL_BAR_ITEM = 'add-tool-bar-item';


type ButtonOptions = {
  options: AppendButtonsProps;
  eventId: string;
}

const toolBarAppendButtonsProps: AppendButtonsProps[] = [];
const gridItemAppendButtonsProps: AppendButtonsProps[] = [];

function StringifyArgs(args: any[]){
  return [...args].map(arg => JSON.stringify(arg));
}
// 初始化时获取所有插件
async function initializePlugins() {
  try {
        // 监听插件初始化事件
    window.electron.on('initialize-plugin', (plugin: any) => {
      console.log('收到插件初始化事件:', plugin);
      window.plugins.setupPlugin(plugin);
    });

    window.plugins.on(ADD_GRID_ITEM_BUTTON, (payload: ButtonOptions) => {
      payload.options.onClick = (...args: any[]) => {
        window.plugins.send(payload.eventId, ...StringifyArgs(args));
      }
      payload.options.eventId = payload.eventId;
      gridItemAppendButtonsProps.push(payload.options);
    });

    window.plugins.on(ADD_TOOL_BAR_ITEM, (payload: ButtonOptions) => {
      payload.options.onClick = (...args: any[]) => {
        window.plugins.send(payload.eventId, ...StringifyArgs(args));
      }
      payload.options.eventId = payload.eventId;
      toolBarAppendButtonsProps.push(payload.options);
    });

    const plugins = await window.plugins.getPlugins();
    // 对每个插件分别请求初始化
    for (const plugin of plugins) {
      await window.plugins.initializePlugin(plugin.id);
    }
    
  } catch (error) {
    console.error('初始化插件失败:', error);
  }
}

export function getToolBarAppendButtonsProps(){
  return toolBarAppendButtonsProps;
}

export function getGridItemAppendButtonsProps(){
  return gridItemAppendButtonsProps;
}

export default initializePlugins;