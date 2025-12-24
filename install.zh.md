```
## 环境安装

[English Version](install.en.md)

requirement: python 3.10-3.13

根据您的操作系统，运行相应的安装脚本[在resources目录下]：

- Windows: 双击运行 `install.bat`
- Linux: 运行 `install.sh`
- macOS: 运行 `install.command`

### macOS Gatekeeper 问题

如果您看到类似 "'atujii' 已损坏，无法打开" 或 "苹果无法检查此 App 是否包含恶意软件" 的错误，这是由于 macOS Gatekeeper 安全设置导致的。

#### 解决方案 1（推荐）：使用安装脚本

`install.command` 脚本现在会自动修复此问题，通过移除应用程序包的隔离属性。

#### 解决方案 2（手动修复）：

如果仍然遇到错误，您可以在终端中运行以下命令手动修复：

```bash
sudo xattr -rd com.apple.quarantine /path/to/atujii.app
```

将 `/path/to/atujii.app` 替换为 atujii 应用程序包的实际路径。

#### 解决方案 3：在安全与隐私中允许

1. 前往系统设置 → 隐私与安全
2. 向下滚动查看有关 atujii 的警告
3. 点击 "仍然打开"
4. 出现提示时确认
```安装过程会自动：
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
   - 夸克网盘链接：https://pan.quark.cn/s/c1a5c5876679
   - 下载后将文件解压到程序resources目录下的 `models` 目录中

注意：如果 resources的models目录不存在，需要手动创建。

