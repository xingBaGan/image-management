const ADD_GRID_ITEM_BUTTON = 'add-grid-item-button';
const ADD_TOOL_BAR_ITEM = 'add-tool-bar-item';
// 监听插件初始化事件
window.electron.on('initialize-plugin', (plugin) => {
  console.log('收到插件初始化事件:', plugin);
  window.plugins.setupPlugin(plugin);
});

// 初始化时获取所有插件
async function initializePlugins() {
  try {
    const plugins = await window.plugins.getPlugins();
    // 对每个插件分别请求初始化
    for (const plugin of plugins) {
      await window.plugins.initializePlugin(plugin.id);
    }
    
    window.plugins.on(ADD_GRID_ITEM_BUTTON, (options, callback) => {
      console.log('收到网格项添加事件:', options);
      if (typeof callback === 'function') {
        callback(options);
      }
    });

    window.plugins.on(ADD_TOOL_BAR_ITEM, (options, callback) => {
      console.log('收到工具栏项添加事件:', options);
      if (typeof callback === 'function') {
        callback(options);
      }
    });
  } catch (error) {
    console.error('初始化插件失败:', error);
  }
}

export default initializePlugins;