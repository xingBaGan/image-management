const fs = require('fs');

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

module.exports = {
	saveImageToLocal,
}
