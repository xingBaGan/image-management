import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { spawn } from 'child_process';
import { loadImagesData, saveImageToLocal } from '../services/FileService.cjs';
import { getImageSize } from '../services/mediaService.cjs';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import crypto from 'crypto';
import { DAOFactory } from '../dao/DAOFactory.cjs';
import { noticeDataChanged } from '../main.cjs';
import { LocalImageData, Category } from '../dao/type.cjs';

interface ImagesData {
    images: LocalImageData[];
    categories: Category[];
}

interface PaginationResponse {
    currentPage: number;
    pageSize: number;
    totalImages: number;
    totalPages: number;
    hasMore: boolean;
}

interface ImagesResponse {
    images: Array<{
        name: string;
        id: string;
        width: number;
        height: number;
    }>;
    pagination: PaginationResponse;
}

let imageServer: express.Application | null = null;
let cloudflaredProcess: any = null;
const isDev = !app.isPackaged;

const imageDAO = DAOFactory.getImageDAO();

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req: express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        const uploadDir = path.join(app.getPath('userData'), 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req: express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

// File filter for images only
const fileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('只允许上传图片文件'));
    }
};

// Initialize multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Generate file hash ID
const generateHashId = (filePath: string, fileSize: number): string => {
    const data = `${filePath}-${fileSize}-${Date.now()}`;
    return crypto.createHash('md5').update(data).digest('hex');
};

// Start Cloudflare Tunnel
const startCloudflaredTunnel = async (port: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            const cloudflaredPath = isDev
                ? path.join(__dirname, '..', '..', 'bin', 'cloudflared.exe')
                : path.join(process.resourcesPath, 'bin', 'cloudflared.exe');

            if (!fs.existsSync(cloudflaredPath)) {
                throw new Error('cloudflared 未安装，请先下载安装 cloudflared');
            }

            cloudflaredProcess = spawn(cloudflaredPath, ['tunnel', '--url', `http://localhost:${port}`]);
            let tunnelUrl = '';

            cloudflaredProcess.stdout.on('data', (data: Buffer) => {
                const output = data.toString();
                console.log('Cloudflare Tunnel 输出:', output);
                const match = output.match(/https:\/\/[^\s]+\.trycloudflare\.com/);
                if (match && !tunnelUrl) {
                    tunnelUrl = match[0];
                    console.log('Cloudflare Tunnel URL:', tunnelUrl);
                    resolve(tunnelUrl);
                }
            });

            cloudflaredProcess.stderr.on('data', (data: Buffer) => {
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

            cloudflaredProcess.on('close', (code: number) => {
                console.log(`Cloudflare Tunnel 已关闭，退出码: ${code}`);
                cloudflaredProcess = null;
            });
        } catch (error) {
            console.error('启动 Cloudflare Tunnel 失败:', error);
            reject(error);
        }
    });
};

export const startImageServer = async (port: number = 8564): Promise<express.Application> => {
    const expressApp = express();
    expressApp.use(cors());

    // Serve static files
    expressApp.get('/', (req: express.Request, res: express.Response) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });

    // Serve upload page
    expressApp.get('/upload', (req: express.Request, res: express.Response) => {
        res.sendFile(path.join(__dirname, 'upload.html'));
    });

    // Get image by ID
    expressApp.get('/images/:id', async (req: express.Request, res: express.Response) => {
        try {
            const id = req.params.id;
            const images = (await loadImagesData()).images.find(img => img.id === id);
            
            if (!images?.path) {
                return res.status(404).json({ error: '图片信息未找到' });
            }

            const localPath = images.path.replace('local-image://', '');
            const filePath = decodeURIComponent(localPath.replace(/^\//, ''));

            if (!fs.existsSync(filePath)) {
                console.warn(`图片文件不存在: ${filePath}`);
                return res.status(404).json({ error: '图片文件不存在' });
            }

            const ext = path.extname(filePath).toLowerCase();
            const mimeTypes: Record<string, string> = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp'
            };

            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
            const fileStream = fs.createReadStream(filePath);

            fileStream.on('error', (error: Error) => {
                console.error('读取文件流错误:', filePath, error);
                if (!res.headersSent) {
                    res.status(500).json({ error: '读取文件失败' });
                } else {
                    res.end();
                }
            });

            fileStream.pipe(res);
        } catch (error) {
            console.error('处理图片请求失败:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: '服务器内部错误' });
            }
        }
    });

    // Upload image API endpoint
    expressApp.post('/api/upload', upload.single('image'), async (req: express.Request, res: express.Response) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: '未找到上传的图片' });
            }

            const file = req.file;
            const filePath = file.path;
            const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
            const fileExt = path.extname(fileName).slice(1);

            const { width, height } = await getImageSize(filePath);
            const id = generateHashId(filePath, file.size);

            const imageRecord: LocalImageData = {
                id,
                path: `local-image://${filePath}`,
                name: fileName,
                extension: fileExt,
                size: file.size,
                width,
                height,
                dateCreated: new Date().toISOString(),
                dateModified: new Date().toISOString(),
                tags: [],
                favorite: false,
                categories: [],
                type: 'image' as const,
                colors: [],
                isBindInFolder: false,
                rating: 0
            };

            const imagesData = await imageDAO.getImagesAndCategories();
            imagesData.images.push(imageRecord);
            await imageDAO.saveImagesAndCategories(imagesData.images, imagesData.categories);
            await noticeDataChanged();

            res.json({
                success: true,
                message: '图片上传成功',
                image: {
                    id: imageRecord.id,
                    name: imageRecord.name,
                    width: imageRecord.width,
                    height: imageRecord.height
                }
            });
        } catch (error) {
            console.error('图片上传处理失败:', error);
            res.status(500).json({ error: '图片上传失败: ' + (error as Error).message });
        }
    });

    // Get images with pagination
    expressApp.get('/api/images', async (req: express.Request, res: express.Response) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const pageSize = parseInt(req.query.pageSize as string) || 10;
            
            const allImagesData = await loadImagesData();
            const filteredImages = (allImagesData.images || [])
                .filter(img => img.type === 'image' && img.path && img.id)
                .map(img => ({
                    name: img.name ? `${img.name}${img.extension ? '.' + img.extension : ''}` : `image_${img.id}`,
                    id: img.id,
                    width: img.width,
                    height: img.height
                }));

            const totalImages = filteredImages.length;
            const totalPages = Math.ceil(totalImages / pageSize);
            const startIndex = (page - 1) * pageSize;
            const imagesSlice = startIndex < totalImages
                ? filteredImages.slice(startIndex, startIndex + pageSize)
                : [];

            const response: ImagesResponse = {
                images: imagesSlice,
                pagination: {
                    currentPage: page,
                    pageSize,
                    totalImages,
                    totalPages,
                    hasMore: page < totalPages && imagesSlice.length > 0
                }
            };

            res.json(response);
        } catch (error) {
            console.error('读取图片数据失败:', error);
            res.status(500).json({ error: '读取图片数据失败' });
        }
    });

    // Start tunnel endpoint
    expressApp.post('/startTunnel', async (req: express.Request, res: express.Response) => {
        try {
            const tunnelUrl = await startCloudflaredTunnel(port);
            console.log(`图片服务器外部访问地址: ${tunnelUrl}`);
            res.json({ message: 'Tunnel started successfully', tunnelUrl });
        } catch (error) {
            console.error('Cloudflare Tunnel 启动失败:', error);
            res.status(500).json({ error: 'Cloudflare Tunnel 启动失败' });
        }
    });

    // Stop tunnel endpoint
    expressApp.post('/stopTunnel', async (req: express.Request, res: express.Response) => {
        try {
            if (cloudflaredProcess) {
                cloudflaredProcess.kill();
                cloudflaredProcess = null;
            }
            res.json({ message: 'Tunnel stopped successfully' });
        } catch (error) {
            console.error('停止 Tunnel 失败:', error);
            res.status(500).json({ error: '停止 Tunnel 失败' });
        }
    });

    try {
        imageServer = expressApp.listen(port, () => {
            console.log(`图片服务器运行在 http://localhost:${port}`);
        }) as any;

        imageServer!.on('error', (error: any) => {
            console.error(`图片服务器启动监听失败 (端口: ${port}):`, error);
        });
    } catch (error) {
        console.error('启动图片服务器时发生意外错误:', error);
        throw error;
    }

    return expressApp;
}; 