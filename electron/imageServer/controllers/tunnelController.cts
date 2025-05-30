import { Request, Response } from 'express';
import { TunnelService } from '../services/tunnelService.cjs';

export class TunnelController {
    static async startTunnel(req: Request, res: Response) {
        try {
            const port = parseInt(req.query.port as string) || 8564;
            const tunnelUrl = await TunnelService.startTunnel(port);
            console.log(`图片服务器外部访问地址: ${tunnelUrl}`);
            res.json({ message: 'Tunnel started successfully', tunnelUrl });
        } catch (error) {
            console.error('Cloudflare Tunnel 启动失败:', error);
            res.status(500).json({ error: 'Cloudflare Tunnel 启动失败' });
        }
    }

    static async stopTunnel(req: Request, res: Response) {
        try {
            await TunnelService.stopTunnel();
            res.json({ message: 'Tunnel stopped successfully' });
        } catch (error) {
            console.error('停止 Tunnel 失败:', error);
            res.status(500).json({ error: '停止 Tunnel 失败' });
        }
    }
} 