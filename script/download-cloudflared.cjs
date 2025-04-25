const fs = require('fs');
const path = require('path');
const axios = require('axios');
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
  console.log('platform', platform, arch)
  if (!urls) {
    throw new Error(`不支持的操作系统: ${platform}`);
  }
  const urlList = urls[arch];
  if (!urlList) {
    throw new Error(`不支持的架构: ${arch}`);
  }
  return urlList;
  // return 
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

// 现代化的下载函数
async function downloadFile(url, destPath, timeout = 30000) {
  const tempPath = `${destPath}.tmp`;
  const writer = fs.createWriteStream(tempPath);

  try {
    const response = await axios({
      method: 'GET',
      url: url,
      timeout: timeout,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br'
      },
      maxRedirects: 5,
      validateStatus: status => status >= 200 && status < 300,
    });

    const totalLength = response.headers['content-length'];

    const progressBar = new ProgressBar('下载进度 [:bar] :percent :etas', {
      complete: '=',
      incomplete: ' ',
      width: 50,
      total: parseInt(totalLength, 10)
    });

    response.data.on('data', (chunk) => {
      progressBar.tick(chunk.length);
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', async () => {
        writer.close();
        try {
          if (fs.existsSync(destPath)) {
            await safeUnlink(destPath);
          }
          fs.renameSync(tempPath, destPath);
          console.log('\n下载完成');
          resolve();
        } catch (error) {
          await safeUnlink(tempPath);
          reject(new Error(`无法重命名文件: ${error.message}`));
        }
      });

      writer.on('error', async (error) => {
        await safeUnlink(tempPath);
        reject(error);
      });
    });
  } catch (error) {
    await safeUnlink(tempPath);
    if (axios.isAxiosError(error)) {
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
        throw new Error(`连接问题: ${error.message}`);
      }
      throw new Error(`下载失败: ${error.response?.status || error.message}`);
    }
    throw error;
  }
}

// 添加格式化文件大小的函数
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

// 改进的重试下载函数
async function downloadWithRetry(urls, destPath, maxRetries = 3) {
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        console.log(`\n[${i + 1}/${urls.length}] 尝试从以下地址下载 (重试 ${retryCount + 1}/${maxRetries}):`);
        console.log(url);
        
        await downloadFile(url, destPath);
        
        // 验证文件大小
        const stats = fs.statSync(destPath);
        console.log(`\n✓ 下载成功！文件大小: ${formatFileSize(stats.size)}`);
        return;
      } catch (error) {
        console.log(`\n✗ 下载失败: ${error.message}`);
        retryCount++;
        
        if (retryCount === maxRetries) {
          if (i === urls.length - 1) {
            throw new Error('所有下载源都失败了');
          }
          console.log('切换到下一个下载源...\n');
          break;
        }
        
        const waitTime = retryCount * 2000; // 递增等待时间
        console.log(`等待 ${waitTime/1000} 秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
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