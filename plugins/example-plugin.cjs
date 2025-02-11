module.exports = {
  id: 'example-plugin',
  name: '示例插件',
  version: '1.0.0',
  description: '这是一个示例插件',
  
  setup(client) {
    // 添加网格项按钮
    client.addGridItemButton({
      label: '处理图片',
      icon: 'camera',
      id: 'handle-image'
    }, async (clickedImage, client) => {
      // 处理点击的图片
      console.log('处理图片:', clickedImage);
    });

    // // 添加工具栏项
    client.addToolBarItem({
      label: '工具栏操作',
      icon: 'camera',
      id: 'tool-bar-operation'
    }, async (selectedImage, client) => {
      // 处理选中的图片
      console.log('工具栏操作:', selectedImage);
    });

  }
};