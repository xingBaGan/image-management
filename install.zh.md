## 环境安装

[English Version](install.en.md)

requirement: python 3.10+

根据您的操作系统，运行相应的安装脚本[在resources目录下]：

- Windows: 双击运行 `install.bat`
- Linux: 运行 `install.sh`
- macOS: 运行 `install.command`

安装过程会自动：
1. 创建 Python 虚拟环境
2. 安装所需依赖
3. 下载 AI 模型（会显示下载进度，大概率会失败。不信邪可以多点几次）

### 手动下载模型（国内用户，自动下载会失败，需要使用代理）

如果自动下载失败，您可以选择以下方式手动下载模型：

1. HuggingFace下载：
   - 访问 https://huggingface.co/honmo/wd14-collection/tree/main
   - 下载 `wd-v1-4-moat-tagger-v2.onnx` 和 `wd-v1-4-moat-tagger-v2.csv` 文件
   - 将下载的文件放入 resources的models目录中

2. 国内网盘下载：
   - 夸克网盘链接：https://pan.quark.cn/s/fb8705d883c3
   - 下载后将文件解压到程序resources目录下的 `models` 目录中

注意：如果 resources的models目录不存在，需要手动创建。

