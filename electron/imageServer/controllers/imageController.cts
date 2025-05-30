import { Request, Response } from 'express';
import { ImageService } from '../services/imageService.cjs';
import path from 'path';
import sharp from 'sharp';

export class ImageController {
    static async uploadImage(req: Request, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: '未找到上传的图片' });
            }

            const imageRecord = await ImageService.saveImage(req.file);
            
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
    }

    static async getImages(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const pageSize = parseInt(req.query.pageSize as string) || 10;
            
            const response = await ImageService.getImages(page, pageSize);
            res.json(response);
        } catch (error) {
            console.error('读取图片数据失败:', error);
            res.status(500).json({ error: '读取图片数据失败' });
        }
    }

    static async getImageById(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const imageBuffer = await ImageService.getImageById(id);
            
            // Set appropriate content type
            const imagesData = await ImageService.getImages(1, 1);
            const image = imagesData.images.find(img => img.id === id);
            const ext = path.extname(image?.name || '').toLowerCase();
            const mimeTypes: Record<string, string> = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp'
            };
            
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
            res.send(imageBuffer);
        } catch (error) {
            console.error('获取图片失败:', error);
            res.status(404).json({ error: (error as Error).message });
        }
    }

    static async getCompressedImage(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const imageBuffer = await ImageService.getImageById(id);
            
            // Get image info for content type
            const imagesData = await ImageService.getImages(1, 1);
            const image = imagesData.images.find(img => img.id === id);
            const ext = path.extname(image?.name || '').toLowerCase();
            const mimeTypes: Record<string, string> = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp'
            };

            // Process image with sharp
            let sharpInstance = sharp(imageBuffer);
            const quality = 60;
            // 根据不同格式设置不同的压缩选项
            if (ext === '.jpg' || ext === '.jpeg') {
                sharpInstance = sharpInstance.jpeg({ quality: quality });
            } else if (ext === '.png') {
                sharpInstance = sharpInstance.png({ quality: quality });
            } else if (ext === '.webp') {
                sharpInstance = sharpInstance.webp({ quality: quality });
            }

            // 压缩图片
            const compressedBuffer = await sharpInstance
                .resize(1200, 1200, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .toBuffer();
            
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
            res.send(compressedBuffer);
        } catch (error) {
            console.error('获取压缩图片失败:', error);
            res.status(404).json({ error: (error as Error).message });
        }
    }
} 