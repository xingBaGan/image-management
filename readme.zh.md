# 图迹 - 图片管理工具
[English Version](readme.md)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/xingBaGan/image-management)


一个简洁优雅的本地图片管理工具，帮助你轻松管理和组织图片与视频资源。
支持 Windows, MacOS, Linux.
可以管理 100000+ 图片和视频，并保持良好的性能。

<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=114484282723113&bvid=BV1YGVZzqE9g&cid=29894836654&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

<iframe width="560" height="315" src="https://www.youtube.com/embed/xjbRYRC8cSY?si=Mzn4BUs32PSkZ4vg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## 文档
[https://deepwiki.com/xingBaGan/image-management](https://deepwiki.com/xingBaGan/image-management)

## 主要功能

- 简洁直观的用户界面
- 快速浏览和管理大量媒体文件
- 强大的分类和标签系统
- 支持图片和视频预览
- AI 自动标签功能
- 随机排序和展示功能
- 完善的快捷键支持
- 拖拽交互优化

## 使用指南

python 3.10+ is required.
node 20+ is required.
安装查看 [install.md](install.md)

### 基础操作

1. **浏览媒体**
   - 切换视图模式: 点击工具栏的网格/列表图标
   - 排序: 点击工具栏的排序按钮，选择排序方式（包括新增的随机排序功能）
   - 查看大图: 双击任意媒体可放大查看
   - 视频预览: 鼠标悬停在视频上可预览，移动鼠标可快速预览不同时间点
   - 筛选: 使用工具栏的筛选按钮，可按照文件类型、大小、日期等条件进行筛选
   - 随机展示: 长按排序按钮激活随机展示功能

2. **导入媒体**
   - 点击工具栏的"导入"按钮
   - 或直接拖放文件到应用窗口
   - 支持 jpg、jpeg、png、gif 等常见图片格式
   - 支持 mp4、mov、avi、webm 等视频格式

3. **管理收藏**
   - 点击媒体右上角的心形图标收藏/取消收藏
   - 在侧边栏点击"收藏夹"查看所有收藏内容

### 分类管理

1. **创建分类**
   - 点击侧边栏底部的"New Category"按钮
   - 输入分类名称并确认

2. **编辑分类**
   - 鼠标悬停在分类上显示编辑按钮
   - 点击编辑按钮修改分类名称
   - 点击删除按钮删除分类

3. **添加媒体到分类**
   - 选择一个或多个媒体文件
   - 点击"Add to Category"按钮
   - 选择目标分类确认添加
   - 分类项会显示当前选中图片的数量

### 批量操作

1. **选择媒体**
   - 点击选中单个媒体
   - 按住 Shift 点击可选择一个范围
   - 在空白处按住鼠标拖动可框选多个媒体
   - 优化的拖拽状态管理，提供更流畅的用户体验

2. **批量操作**
   - 选中媒体后显示批量操作工具栏
   - 支持批量删除
   - 支持批量添加到分类
   - 支持批量添加标签

### AI 功能使用

1. **AI 标签**
   - 选择一个或多个媒体文件
   - 点击工具栏的"AI Tag"按钮
   - 等待 AI 自动识别并添加标签
   - 可以手动编辑和管理标签

2. **ComfyUI 集成**
   - 确保已正确安装 ComfyUI
   - 在设置中配置 ComfyUI 路径
   - 选择要处理的媒体文件
   - 选择预设的工作流或导入自定义工作流
   - 执行处理

## 技术栈

- Electron - 跨平台桌面应用框架
- React - 用户界面构建
- TypeScript - 类型安全的 JavaScript
- Tailwind CSS - 原子化 CSS 框架
- Vite - 现代前端构建工具
- FFmpeg - 视频处理
- Python - AI 功能支持
- ComfyUI - AI 图像处理
- PouchDB - 本地数据库
## 开发指南

1. 安装依赖

```bash
# 安装 Node.js 依赖
npm install

# 安装 Python 依赖
pip install -r requirements.txt
```

2. 开发模式运行

```bash
npm run electron:dev
```

3. 打包

```bash
npm run electron:build --win
npm run electron:build --mac
npm run electron:build --linux
```

## 注意事项

- 当前版本: 0.4.12
- 首次运行会在用户数据目录创建配置文件
- 支持的图片格式: jpg、jpeg、png、gif
- 支持的视频格式: mp4、mov、avi、webm
- AI 功能需要安装相应的 Python 环境和依赖
- ComfyUI 功能需要正确配置 ComfyUI 环境
- 建议定期备份配置文件(images.json)

## 未来计划

- [x] 图片标签系统
- [x] 视频预览优化
- [x] 图片信息查看
- [x] 支持颜色分类
- [x] 多语言支持
- [x] 快捷键支持
- [x] 主色提取
- [x] 随机排序功能
- [ ] 可扩展的插件系统
   - [ ] 图片编辑功能
   - [ ] 更多 AI 模型集成
- [ ] ComfyUI 集成 - 支持通过 ComfyUI 进行图片处理

## 贡献指南

欢迎提交 Issue 和 Pull Request 来帮助改进这个项目。

## 许可证

本项目使用 [GNU General Public License v3.0](./LICENSE) 许可证。
