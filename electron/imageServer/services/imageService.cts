import { app } from 'electron';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { getImageSize } from '../../services/mediaService.cjs';
import { DAOFactory } from '../../dao/DAOFactory.cjs';
import { noticeDataChanged } from '../../main.cjs';
import { LocalImageData } from '../../dao/type.cjs';
import { ImagesResponse } from '../models/types';

const imageDAO = DAOFactory.getImageDAO();

// Multer configuration
export const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(app.getPath('userData'), 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

export const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('只允许上传图片文件'));
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

export class ImageService {
    static generateHashId(filePath: string, fileSize: number): string {
        const data = `${filePath}-${fileSize}-${Date.now()}`;
        return crypto.createHash('md5').update(data).digest('hex');
    }

    static async saveImage(file: Express.Multer.File): Promise<LocalImageData> {
        const filePath = file.path;
        const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const fileExt = path.extname(fileName).slice(1);
        const { width, height } = await getImageSize(filePath);
        const id = this.generateHashId(filePath, file.size);

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

        return imageRecord;
    }

    static async getImages(page: number, pageSize: number): Promise<ImagesResponse> {
        const allImagesData = await imageDAO.getImagesAndCategories();
        const filteredImages = (allImagesData.images as LocalImageData[])
            .filter(img => img.type === 'image' && img.path && img.id && typeof img.width === 'number' && typeof img.height === 'number')
            .map(img => ({
                ...img,
                name: img.name ? `${img.name}${img.extension ? '.' + img.extension : ''}` : `image_${img.id}`,
                id: img.id,
                width: img.width,
                height: img.height,
            }));

        const totalImages = filteredImages.length;
        const totalPages = Math.ceil(totalImages / pageSize);
        const startIndex = (page - 1) * pageSize;
        const imagesSlice = startIndex < totalImages
            ? filteredImages.slice(startIndex, startIndex + pageSize)
            : [];

        return {
            images: imagesSlice,
            pagination: {
                currentPage: page,
                pageSize,
                totalImages,
                totalPages,
                hasMore: page < totalPages && imagesSlice.length > 0
            }
        };
    }

    static async getImageById(id: string): Promise<Buffer> {
        const imagesData = await imageDAO.getImagesAndCategories();
        const image = imagesData.images.find(img => img.id === id);
        
        if (!image?.path) {
            throw new Error('图片信息未找到');
        }

        const localPath = image.path.replace('local-image://', '');
        const filePath = decodeURIComponent(localPath.replace(/^\//, ''));

        if (!fs.existsSync(filePath)) {
            throw new Error('图片文件不存在');
        }

        return fs.readFileSync(filePath);
    }
} 