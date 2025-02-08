## Environment Installation
[Chinese Version](install.zh.md)

requirement: python 3.10+

Run the appropriate installation script [in the resources directory] according to your operating system:

- Windows: Double-click to run `install.bat`
- Linux: Run `install.sh`
- macOS: Run `install.command`


The installation process will automatically:
1. Create Python virtual environment
2. Install required dependencies
3. Download AI models (download progress will be displayed, likely to fail. You can try multiple times if persistent)

### Manual Model Download

If the automatic download fails, you can choose the following methods to download the models manually:

1. Download from HuggingFace:
   - Visit https://huggingface.co/honmo/wd14-collection/tree/main
   - Download `wd-v1-4-moat-tagger-v2.onnx` and `wd-v1-4-moat-tagger-v2.csv` files
   - Place the downloaded files in the models directory under resources

2. Download from Alternative Source:
   - Quark Network Disk Link: https://pan.quark.cn/s/fb8705d883c3
   - After downloading, extract the files to the `models` directory under the program's resources directory

3. Download from Alternative Source:
   - Google Drive Link: https://drive.google.com/drive/folders/1UaAV0LF4xOB6h384XFQyxzeMyUa830Q2?usp=sharing
   - After downloading, extract the files to the `models` directory under the program's resources directory


Note: If the models directory under resources doesn't exist, you need to create it manually. 