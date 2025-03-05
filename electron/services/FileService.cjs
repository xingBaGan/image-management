const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { logger } = require('./logService.cjs');

// 获取应用数据目录中的 JSON 文件路径
const saveImageToLocal = async (imageData, fileName, ext) => {
	try {
		// 确保 images 目录存在
		const imagesDir = path.join(app.getPath('userData'), 'images');
		if (!fs.existsSync(imagesDir)) {
			fs.mkdirSync(imagesDir, { recursive: true });
		}
		let uniqueFileName;
		if (!fileName.includes('.')) {
			uniqueFileName = `${fileName}.${ext}`;
		} else {
			uniqueFileName = fileName;
		}

		// 缓存图片
		const filePath = path.join(imagesDir, uniqueFileName);

		// 将 Uint8Array 转换为 Buffer 并写入文件
		const buffer = Buffer.from(imageData);
		await fs.promises.writeFile(filePath, buffer);

		// 返回本地路径
		return `local-image://${filePath}`;
	} catch (error) {
		console.error('保存图片失败:', error);
		throw error;
	}
};

const getJsonFilePath = () => {
	return path.join(app.getPath('userData'), 'images.json');
};

function loadImagesData() {
	try {
		const imagesJsonPath = getJsonFilePath();
		let data = JSON.parse(fs.readFileSync(imagesJsonPath, 'utf8'));


		if (!data.categories) {
			data.categories = [];
		}

		// 更新图片数据结构
		let hasUpdates = false;
		data.images = data.images.map(img => {
			const updatedImg = { ...img };

			// 确保所有必需字段存在
			if (!updatedImg.id) updatedImg.id = Date.now().toString();
			if (!updatedImg.name) updatedImg.name = path.basename(updatedImg.path);
			if (!updatedImg.dateCreated) updatedImg.dateCreated = new Date().toISOString();
			if (!updatedImg.dateModified) updatedImg.dateModified = new Date().toISOString();
			if (!updatedImg.size) updatedImg.size = 0;
			if (!updatedImg.tags) updatedImg.tags = [];
			if (typeof updatedImg.favorite !== 'boolean') updatedImg.favorite = false;
			if (!updatedImg.categories) updatedImg.categories = [];
			if (!updatedImg.type) {
				// 根据文件扩展名判断类型
				const ext = path.extname(updatedImg.path).toLowerCase();
				updatedImg.type = ['.mp4', '.mov', '.avi', '.webm'].includes(ext) ? 'video' : 'image';
			}

			return updatedImg;
		});

		if (hasUpdates) {
			fs.writeFileSync(imagesJsonPath, JSON.stringify(data, null, 2));
		}

		return data;
	} catch (error) {
		console.error('Error loading images data:', error);
		return { images: [], categories: [] };
	}
}

function getImageById(id) {
	const data = loadImagesData();
	return data.images.find(img => img.id === id);
}

function getImagesByIds(ids) {
	const data = loadImagesData();
	return data.images.filter(img => ids.includes(img.id));
}

async function deletePhysicalFile(filePath) {
	try {
		// 解码文件路径并移除 local-image:// 前缀
		const localPath = decodeURIComponent(filePath.replace('local-image://', ''));
		
		// 检查文件是否存在
		if (fs.existsSync(localPath)) {
			await fs.promises.unlink(localPath);
			logger.info(`物理文件删除成功: ${localPath}`);
			return true;
		} else {
			logger.warn(`文件不存在: ${localPath}`);
			return false;
		}
	} catch (error) {
		logger.error(`删除物理文件失败: ${filePath}`, error);
		throw error;
	}
}

module.exports = {
	saveImageToLocal,
	loadImagesData,
	getJsonFilePath,
	getImageById,
	getImagesByIds,
	deletePhysicalFile,
}
