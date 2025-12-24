## Environment Installation
[Chinese Version](install.zh.md)

requirement: python 3.10-3.13

Run the appropriate installation script [in the resources directory] according to your operating system:

- Windows: Double-click to run `install.bat`
- Linux: Run `install.sh`
- macOS: Run `install.command`

### macOS Gatekeeper Issue

If you see an error like "'atujii' is damaged and can't be opened" or "Apple can't check app for malicious software", this is due to macOS Gatekeeper security settings.

#### Solution 1 (Recommended): Use the Install Script

The `install.command` script now automatically fixes this issue by removing the quarantine attribute from the application bundle.

#### Solution 2 (Manual Fix):

If you still encounter the error, you can fix it manually by running this command in Terminal:

```bash
sudo xattr -rd com.apple.quarantine /path/to/atujii.app
```

Replace `/path/to/atujii.app` with the actual path to the atujii application bundle.

#### Solution 3: Allow in Security & Privacy

1. Go to System Settings → Privacy & Security
2. Scroll down to see the warning about atujii
3. Click "Open Anyway"
4. Confirm when prompted


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
   - Quark Network Disk Link: https://pan.quark.cn/s/c1a5c5876679
   - After downloading, extract the files to the `models` directory under the program's resources directory

3. Download from Alternative Source:
   - Google Drive Link: https://drive.google.com/drive/folders/1UaAV0LF4xOB6h384XFQyxzeMyUa830Q2?usp=sharing
   - After downloading, extract the files to the `models` directory under the program's resources directory


Note: If the models directory under resources doesn't exist, you need to create it manually. 