import { app } from 'electron';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';

export class TunnelService {
    private static cloudflaredProcess: ChildProcess | null = null;
    private static readonly isDev = !app.isPackaged;

    static async startTunnel(port: number): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                const cloudflaredPath = this.isDev
                    ? path.join(__dirname, '..', '..', '..', 'bin', 'cloudflared.exe')
                    : path.join(process.resourcesPath, 'bin', 'cloudflared.exe');

                if (!require('fs').existsSync(cloudflaredPath)) {
                    throw new Error('cloudflared 未安装，请先下载安装 cloudflared');
                }

                this.cloudflaredProcess = spawn(cloudflaredPath, ['tunnel', '--url', `http://localhost:${port}`]);
                let tunnelUrl = '';

                this.cloudflaredProcess.stdout?.on('data', (data: Buffer) => {
                    const output = data.toString();
                    console.log('Cloudflare Tunnel 输出:', output);
                    const match = output.match(/https:\/\/[^\s]+\.trycloudflare\.com/);
                    if (match && !tunnelUrl) {
                        tunnelUrl = match[0];
                        console.log('Cloudflare Tunnel URL:', tunnelUrl);
                        resolve(tunnelUrl);
                    }
                });

                this.cloudflaredProcess.stderr?.on('data', (data: Buffer) => {
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

                this.cloudflaredProcess.on('close', (code: number) => {
                    console.log(`Cloudflare Tunnel 已关闭，退出码: ${code}`);
                    this.cloudflaredProcess = null;
                });
            } catch (error) {
                console.error('启动 Cloudflare Tunnel 失败:', error);
                reject(error);
            }
        });
    }

    static async stopTunnel(): Promise<void> {
        if (this.cloudflaredProcess) {
            this.cloudflaredProcess.kill();
            this.cloudflaredProcess = null;
        }
    }
} 