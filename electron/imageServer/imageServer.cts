import express from 'express';
import cors from 'cors';
import path from 'path';
import imageRoutes from './routes/imageRoutes.cjs';
import tunnelRoutes from './routes/tunnelRoutes.cjs';

export const startAPIServer = async (port: number = 8564): Promise<express.Application> => {
    const expressApp = express();
    expressApp.use(cors());

    // 静态文件服务
    expressApp.use(express.static(path.join(__dirname, 'dist')));

    // API 路由
    expressApp.use('/api/images', imageRoutes);
    expressApp.use('/api/tunnel', tunnelRoutes);

    // 所有其他路由返回 React 应用
    expressApp.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });

    try {
        const server = expressApp.listen(port, () => {
            console.log(`图片服务器运行在 http://localhost:${port}`);
        });

        server.on('error', (error: any) => {
            console.error(`图片服务器启动监听失败 (端口: ${port}):`, error);
        });
    } catch (error) {
        console.error('启动图片服务器时发生意外错误:', error);
        throw error;
    }

    return expressApp;
}; 