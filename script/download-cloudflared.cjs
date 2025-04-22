const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const ProgressBar = require('progress');

// 确定操作系统和架构
const platform = process.platform;
const arch = process.arch;

// 添加国内镜像源
const MIRROR_URLS = {
  win32: {
    x64: [
      'https://ghfast.top/https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe',
      'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe',
      'https://hub.gitmirror.com/https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe'
    ],
    arm64: [
      'https://ghfast.top/https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-arm64.exe',
      'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-arm64.exe',
      'https://hub.gitmirror.com/https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-arm64.exe'
    ]
  },
  darwin: {
    x64: [
      'https://ghfast.top/https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz',
      'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz',
      'https://hub.gitmirror.com/https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz'
    ],
    arm64: [
      'https://ghfast.top/https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64.tgz',
      'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64.tgz',
      'https://hub.gitmirror.com/https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64.tgz'
    ]
  },
  linux: {
    x64: [
      'https://ghfast.top/https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64',
      'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64',
      'https://hub.gitmirror.com/https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64'
    ],
    arm64: [
      'https://ghfast.top/https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64',
      'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64',
      'https://hub.gitmirror.com/https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64'
    ]
  }
};

// 获取下载URL列表
function getDownloadUrls() {
  const urls = MIRROR_URLS[platform];
  if (!urls) {
    throw new Error(`不支持的操作系统: ${platform}`);
  }
  const urlList = urls[arch];
  if (!urlList) {
    throw new Error(`不支持的架构: ${arch}`);
  }
  return urlList;
}

// 创建bin目录
function createBinDirectory() {
  const binPath = path.join(__dirname, '..', 'bin');
  if (!fs.existsSync(binPath)) {
    fs.mkdirSync(binPath, { recursive: true });
  }
  return binPath;
}

// 检查文件是否可用
function isFileAvailable(filePath) {
  try {
    // 尝试打开文件
    const fd = fs.openSync(filePath, 'r+');
    fs.closeSync(fd);
    return true;
  } catch (error) {
    return false;
  }
}

// 安全地删除文件
function safeUnlink(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.log(`警告: 无法删除文件 ${filePath}: ${error.message}`);
  }
}

// 下载文件（带进度条）
function downloadFile(url, destPath, timeout = 30000) {
  return new Promise((resolve, reject) => {
    // 检查目标文件是否被占用
    if (fs.existsSync(destPath) && !isFileAvailable(destPath)) {
      console.log('目标文件被占用，尝试关闭进程...');
      try {
        // 在 Windows 上尝试结束占用进程
        if (process.platform === 'win32') {
          execSync(`taskkill /F /IM cloudflared.exe`, { stdio: 'ignore' });
        }
        // 等待文件释放
        setTimeout(() => {
          safeUnlink(destPath);
        }, 1000);
      } catch (error) {
        console.log('警告: 无法结束占用进程');
      }
    }

    const tempPath = `${destPath}.tmp`;
    const file = fs.createWriteStream(tempPath);
    
    const request = https.get(url, { timeout }, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        file.close();
        safeUnlink(tempPath);
        downloadFile(response.headers.location, destPath, timeout)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        file.close();
        safeUnlink(tempPath);
        reject(new Error(`HTTP 状态码: ${response.statusCode}`));
        return;
      }

      // 获取文件大小
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;

      // 创建进度条
      const bar = new ProgressBar('下载进度 [:bar] :percent :etas', {
        complete: '=',
        incomplete: ' ',
        width: 50,
        total: totalSize
      });

      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        bar.tick(chunk.length);
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close(() => {
          try {
            // 下载完成后，将临时文件重命名为目标文件
            if (fs.existsSync(destPath)) {
              safeUnlink(destPath);
            }
            fs.renameSync(tempPath, destPath);
            console.log('\n'); // 进度条完成后换行
            resolve();
          } catch (error) {
            safeUnlink(tempPath);
            reject(new Error(`无法重命名文件: ${error.message}`));
          }
        });
      });

      file.on('error', (err) => {
        file.close();
        safeUnlink(tempPath);
        reject(err);
      });
    });

    request.on('error', (err) => {
      file.close();
      safeUnlink(tempPath);
      reject(err);
    });

    request.on('timeout', () => {
      request.destroy();
      file.close();
      safeUnlink(tempPath);
      reject(new Error('请求超时'));
    });
  });
}

// 添加格式化文件大小的函数
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

// 修改 downloadWithRetry 函数，添加更多信息
async function downloadWithRetry(urls, destPath) {
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      console.log(`\n[${i + 1}/${urls.length}] 尝试从以下地址下载:`);
      console.log(url);
      await downloadFile(url, destPath);
      console.log(`\n✓ 下载成功！`);
      
      // 显示文件信息
      const stats = fs.statSync(destPath);
      console.log(`文件大小: ${formatFileSize(stats.size)}`);
      return;
    } catch (error) {
      console.log(`\n✗ 下载失败: ${error.message}`);
      if (i === urls.length - 1) {
        throw new Error('所有下载源都失败了');
      }
      console.log('正在切换到下一个下载源...\n');
    }
  }
}

// 解压tgz文件（用于macOS）
function extractTgz(tgzPath, destPath) {
  execSync(`tar -xzf "${tgzPath}" -C "${path.dirname(destPath)}"`);
  fs.unlinkSync(tgzPath);
}

// 主函数
async function main() {
  try {
    const urls = getDownloadUrls();
    const binPath = createBinDirectory();
    const fileName = platform === 'win32' ? 'cloudflared.exe' : 'cloudflared';
    const filePath = path.join(binPath, fileName);
    if (fs.existsSync(filePath)) {
      console.log('cloudflared 已存在');
      return;
    }
    console.log('开始下载 cloudflared...');
    
    // 确保目标文件未被占用
    if (fs.existsSync(filePath) && !isFileAvailable(filePath)) {
      console.log('清理旧文件...');
      if (platform === 'win32') {
        try {
          execSync(`taskkill /F /IM cloudflared.exe`, { stdio: 'ignore' });
        } catch (error) {
          console.log('警告: 无法结束 cloudflared 进程');
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (platform === 'darwin') {
      const tgzPath = path.join(binPath, 'cloudflared.tgz');
      await downloadWithRetry(urls, tgzPath);
      console.log('解压文件...');
      extractTgz(tgzPath, filePath);
    } else {
      await downloadWithRetry(urls, filePath);
    }
    
    if (platform !== 'win32') {
      fs.chmodSync(filePath, '755');
    }
    
    console.log('cloudflared 下载完成!');
    console.log('文件保存在:', filePath);
  } catch (error) {
    console.error('下载失败:', error.message);
    process.exit(1);
  }
}

main(); 