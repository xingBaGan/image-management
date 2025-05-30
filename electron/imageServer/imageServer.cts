import express from 'express';
import cors from 'cors';
import path from 'path';
import imageRoutes from './routes/imageRoutes.cjs';
import tunnelRoutes from './routes/tunnelRoutes.cjs';

export const startAPIServer = async (port: number = 8564): Promise<express.Application> => {
    const expressApp = express();
    expressApp.use(cors());

    // Static routes
    expressApp.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });

    expressApp.get('/upload', (req, res) => {
        res.sendFile(path.join(__dirname, 'upload.html'));
    });

    // API routes
    expressApp.use('/api/images', imageRoutes);
    expressApp.use('/api/tunnel', tunnelRoutes);

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