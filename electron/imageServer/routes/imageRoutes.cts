import { Router } from 'express';
import { ImageController } from '../controllers/imageController.cjs';
import { upload } from '../services/imageService.cjs';

const router = Router();

// Image routes
router.post('/upload', upload.single('image'), ImageController.uploadImage);
router.get('/', ImageController.getImages);
router.get('/compressed/:id', ImageController.getCompressedImage);
router.get('/original/:id', ImageController.getImageById);

export default router; 