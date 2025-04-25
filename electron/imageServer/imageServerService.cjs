"use strict";
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { spawn } = require('child_process');
const { loadImagesData } = require('../services/FileService.cjs');
let imageServer = null;
let cloudflaredProcess = null;
const isDev = !app.isPackaged;
// 启动 Cloudflare Tunnel
const startCloudflaredTunnel = async (port) => {
    return new Promise((resolve, reject) => {
        try {
            // 检查 cloudflared 是否安装
            const cloudflaredPath = isDev
                ? path.join(__dirname, '..', '..', 'bin', 'cloudflared.exe')
                : path.join(process.resourcesPath, 'bin', 'cloudflared.exe');
            if (!fs.existsSync(cloudflaredPath)) {
                throw new Error('cloudflared 未安装，请先下载安装 cloudflared');
            }
            // 启动 cloudflared tunnel
            cloudflaredProcess = spawn(cloudflaredPath, ['tunnel', '--url', `http://localhost:${port}`]);
            let tunnelUrl = '';
            cloudflaredProcess.stdout.on('data', (data) => {
                const output = data.toString();
                console.log('Cloudflare Tunnel 输出:', output);
                // 捕获生成的 tunnel URL
                const match = output.match(/https:\/\/[^\s]+\.trycloudflare\.com/);
                if (match && !tunnelUrl) {
                    tunnelUrl = match[0];
                    console.log('Cloudflare Tunnel URL:', tunnelUrl);
                    resolve(tunnelUrl);
                }
            });
            cloudflaredProcess.stderr.on('data', (data) => {
                const str = data.toString();
                console.error('Cloudflare Tunnel 错误:', str);
                if (str.includes('Your quick Tunnel has been created! Visit it at (it may take some time to be reachable)')) {
                    const match = str.match(/https:\/\/[^\s]+/);
                    if (match && !tunnelUrl) {
                        tunnelUrl = match[0];
                        resolve(tunnelUrl);
                    }
                }
            });
            cloudflaredProcess.on('close', (code) => {
                console.log(`Cloudflare Tunnel 已关闭，退出码: ${code}`);
                cloudflaredProcess = null;
            });
        }
        catch (error) {
            console.error('启动 Cloudflare Tunnel 失败:', error);
            reject(error);
        }
    });
};
const startImageServer = async (port = 8564) => {
    const expressApp = express();
    expressApp.use(cors());
    // 提供静态文件服务（index.html）
    expressApp.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });
    expressApp.get('/images/:id', async (req, res) => {
        try {
            const id = req.params.id;
            const images = (await loadImagesData()).images.find(img => img.id === id);
            if (!images?.path)
                return res.status(404).json({ error: '图片信息未找到' }); // Improved 404
            const localPath = images.path.replace('local-image://', '');
            // Decode URI component is crucial for paths with spaces or special chars
            const filePath = decodeURIComponent(localPath.replace(/^\//, '')); // Remove potential leading slash
            // 检查文件是否存在 (Asynchronous check is better for performance, but sync is okay here)
            if (!fs.existsSync(filePath)) {
                console.warn(`图片文件不存在: ${filePath}`);
                return res.status(404).json({ error: '图片文件不存在' });
            }
            // 读取文件类型
            const ext = path.extname(filePath).toLowerCase();
            const mimeTypes = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp'
                // Add other types if needed
            };
            // 设置正确的 Content-Type
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
            // 使用流式传输，这是处理大文件的推荐方式，也是非阻塞的 I/O
            const fileStream = fs.createReadStream(filePath);
            // 当流出错时处理
            fileStream.on('error', (error) => {
                console.error('读取文件流错误:', filePath, error);
                // Avoid sending JSON response if headers already sent or stream partially sent
                if (!res.headersSent) {
                    res.status(500).json({ error: '读取文件失败' });
                }
                else {
                    res.end(); // Terminate the response if possible
                }
            });
            // 当流成功完成时（可选，用于调试）
            // fileStream.on('end', () => {
            //   console.log(`Sent file: ${filePath}`);
            // });
            // 将文件流管道连接到响应流
            fileStream.pipe(res);
        }
        catch (error) {
            console.error('处理图片请求失败:', error);
            // Avoid sending JSON response if headers already sent
            if (!res.headersSent) {
                res.status(500).json({ error: '服务器内部错误' });
            }
        }
    });
    // 修改图片列表API，添加分页功能
    expressApp.get('/api/images', async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;
            // loadImagesData 内部可能是异步读取文件，但这里 await 会处理好 Promise
            const allImagesData = await loadImagesData();
            const filteredImages = (allImagesData.images || []) // Add default empty array
                .filter(img => img.type === 'image' && img.path && img.id) // Ensure essential fields exist
                .map(img => ({
                name: img.name ? `${img.name}${img.extension ? '.' + img.extension : ''}` : `image_${img.id}`, // Handle missing name/extension
                id: img.id,
                width: img.width,
                height: img.height,
                // Consider adding a placeholder or direct path if needed by frontend
                // url: `/images/${img.id}` // Example direct URL
            }));
            const totalImages = filteredImages.length;
            const totalPages = Math.ceil(totalImages / pageSize);
            const startIndex = (page - 1) * pageSize;
            // Ensure startIndex is not out of bounds
            const imagesSlice = startIndex < totalImages
                ? filteredImages.slice(startIndex, startIndex + pageSize)
                : [];
            res.json({
                images: imagesSlice,
                pagination: {
                    currentPage: page,
                    pageSize,
                    totalImages,
                    totalPages,
                    hasMore: page < totalPages && imagesSlice.length > 0
                }
            });
        }
        catch (error) {
            console.error('读取图片数据失败:', error);
            res.status(500).json({ error: '读取图片数据失败' });
        }
    });
    // 启动服务器
    return new Promise(async (resolve, reject) => {
        try {
            // expressApp.listen 是异步的。它开始监听端口，
            // 并立即返回，不会阻塞当前代码执行。
            // 当服务器准备好接收连接时，提供的回调函数会被调用。
            imageServer = expressApp.listen(port, async () => {
                // 这个回调函数在服务器成功启动后异步执行
                console.log(`图片服务器运行在 http://localhost:${port}`);
                // 启动 Cloudflare Tunnel (startCloudflaredTunnel 内部使用异步的 spawn)
                try {
                    // await 在这里等待 startCloudflaredTunnel 的 Promise 完成，
                    // 但由于 listen 的回调本身是异步执行的，这不会阻塞启动服务器的初始调用。
                    const tunnelUrl = await startCloudflaredTunnel(port);
                    console.log(`图片服务器外部访问地址: ${tunnelUrl}`);
                    // 解析 Promise，传递服务器实例和隧道 URL
                    resolve({ server: imageServer, tunnelUrl });
                }
                catch (error) {
                    console.error('Cloudflare Tunnel 启动失败:', error);
                    // 即使 tunnel 失败，服务器仍然可用于本地访问
                    // 解析 Promise，只传递服务器实例
                    resolve({ server: imageServer });
                }
            });
            // 处理 listen 本身可能发生的错误 (例如端口已被占用)
            imageServer.on('error', (error) => {
                console.error(`图片服务器启动监听失败 (端口: ${port}):`, error);
                reject(error); // 拒绝外部的 Promise
            });
        }
        catch (error) {
            // 捕获 expressApp.listen 调用之前的同步错误 (虽然不太可能)
            console.error('启动图片服务器时发生意外错误:', error);
            reject(error);
        }
    });
};
const stopImageServer = () => {
    if (imageServer) {
        imageServer.close();
        imageServer = null;
    }
    if (cloudflaredProcess) {
        cloudflaredProcess.kill();
        cloudflaredProcess = null;
    }
};
module.exports = {
    startImageServer,
    stopImageServer,
};
