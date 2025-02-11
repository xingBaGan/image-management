module.exports = {
  id: 'example-plugin',
  name: '示例插件',
  version: '1.0.0',
  description: '这是一个示例插件',
  
  setup(client) {
    // 添加网格项按钮
    client.addGridItemButton({
      buttonText: '处理图片',
      buttonIndex: 0
    }, async (clickedImage, client) => {
      // 处理点击的图片
      console.log('处理图片:', clickedImage);
    });

    // // 添加工具栏项
    client.addToolBarItem({
      buttonText: '工具栏操作',
      buttonIndex: 1
    }, async (selectedImage, client) => {
      // 处理选中的图片
      console.log('工具栏操作:', selectedImage);
    });

  }
};