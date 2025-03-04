const { app } = require('electron');
const probe = require('probe-image-size');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path.replace('app.asar', 'app.asar.unpacked');
const ffprobePath = require('@ffprobe-installer/ffprobe').path.replace('app.asar', 'app.asar.unpacked');
const isDev = !app.isPackaged;
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const { generateHashId } = require('../utils/index.cjs');
// 设置 ffmpeg 和 ffprobe 路径
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const { supportedExtensions } = isDev
	? require(path.join(__dirname, '../../', 'config.cjs'))  // 开发环境
	: require(path.join(process.resourcesPath, 'config.cjs'));  // 生产环境


// 获取视频时长
const getVideoDuration = (filePath) => {
	return new Promise((resolve, reject) => {
		ffmpeg.ffprobe(filePath, (err, metadata) => {
			if (err) {
				console.error('获取视频时长失败:', err);
				reject(err);
				return;
			}
			resolve(metadata.format.duration);
		});
	});
};

// 生成视频缩略图
const generateVideoThumbnail = (filePath) => {
	return new Promise((resolve, reject) => {
		const thumbnailPath = path.join(app.getPath('userData'), 'thumbnails', `${path.basename(filePath)}.png`);

		// 确保缩略图目录存在
		fs.mkdirSync(path.dirname(thumbnailPath), { recursive: true });

		ffmpeg(filePath)
			.screenshots({
				timestamps: ['1'], // 在1秒处截图
				filename: path.basename(thumbnailPath),
				folder: path.dirname(thumbnailPath),
				size: '320x240' // 缩略图尺寸
			})
			.on('end', () => {
				// 将缩略图转换为 base64
				fs.readFile(thumbnailPath, (err, data) => {
					if (err) {
						console.error('读取缩略图失败:', err);
						reject(err);
						return;
					}
					const base64 = `data:image/png;base64,${data.toString('base64')}`;
					resolve(base64);
				});
			})
			.on('error', (err) => {
				console.error('生成缩略图失败:', err);
				reject(err);
			});
	});
};


const getImageSize = async (filePath) => {
	try {
		// 处理 base64 图片
		if (filePath.startsWith('data:image')) {
			const base64 = filePath.split(',')[1];
			const buffer = Buffer.from(base64, 'base64');
			const dimensions = probe.sync(buffer);
			return {
				width: dimensions.width,
				height: dimensions.height,
			};
		}

		// 检查是否为视频文件
		const ext = path.extname(filePath).toLowerCase();
		if (['.mp4', '.mov', '.avi', '.webm'].includes(ext)) {
			return { width: 0, height: 0 };
		}
		if (filePath.startsWith('local-image://')) {
			filePath = decodeURIComponent(filePath.replace('local-image://', ''));
		}
		// 读取图片文件
		const buffer = await fsPromises.readFile(filePath);
		const dimensions = probe.sync(buffer);
		if (!dimensions) {
			console.warn(`无法获取图片尺寸: ${filePath}`);
			return { width: 0, height: 0 };
		}

		return {
			width: dimensions.width,
			height: dimensions.height
		};
	} catch (error) {
		console.error(`获取图片尺寸失败: ${filePath}`, error);
		return { width: 0, height: 0 };
	}
};
const getRatio = async (width, height) => {
	const ratio = width / height;
	// ['4:3', '16:9', '1:1', '3:4', '9:16']
	const ratios = ['4:3', '16:9', '1:1', '3:4', '9:16'];
	const closestRatio = ratios.reduce((prev, curr) => {
		const [prevWidth, prevHeight] = prev.split(':').map(Number);
		const [currWidth, currHeight] = curr.split(':').map(Number);
		const prevRatio = prevWidth / prevHeight;
		const currRatio = currWidth / currHeight;
		return (Math.abs(ratio - prevRatio) < Math.abs(ratio - currRatio) ? prev : curr);
	});
	return closestRatio;
};

const processDirectoryFiles = async (dirPath) => {
	const processedFiles = [];
	try {
		const stats = await fsPromises.stat(dirPath);
		if (stats.isDirectory()) {
			const files = await fsPromises.readdir(dirPath);
			for (const file of files) {
				try {
					const filePath = path.join(dirPath, file);
					const _stats = await fsPromises.stat(filePath);

					if (_stats.isDirectory()) {
						// 递归处理子文件夹
						const subDirFiles = await processDirectoryFiles(filePath);
						processedFiles.push(...subDirFiles);
					} else if (_stats.isFile()) {
						const metadata = await getMetadataByFilePath(filePath, _stats);
						if (metadata) {
							processedFiles.push(metadata);
						}
					}
				} catch (error) {
					console.error(`处理文件 ${file} 时出错:`, error);
					continue;
				}
			}
		} else {
			const metadata = await getMetadataByFilePath(dirPath, stats);
			if (metadata) {
				processedFiles.push(metadata);
			}
		}

		return processedFiles;
	} catch (error) {
		console.error('处理目录失败:', error);
		throw error;
	}
};

const getMetadataByFilePath = async (filePath, stats) => {
	const ext = path.extname(filePath).toLowerCase();
	if (!supportedExtensions.includes(ext)) return;
	const isVideo = ['.mp4', '.mov', '.avi', '.webm'].includes(ext);
	const localImageUrl = `local-image://${encodeURIComponent(filePath)}`;
	const thumbnail = isVideo ? await generateVideoThumbnail(filePath) : undefined;
	let imageSize = await getImageSize(filePath);
	imageSize = isVideo ? await getImageSize(thumbnail) : imageSize;
	const id = generateHashId(filePath, stats.size);
	const ratio = await getRatio(imageSize.width, imageSize.height);
	const metadata = {
		id: id,
		path: localImageUrl,
		name: path.basename(filePath, ext), // 移除扩展名
		extension: ext.slice(1), // 移除点号
		size: stats.size,
		dateCreated: stats.birthtime.toISOString(),
		dateModified: stats.mtime.toISOString(),
		tags: [],
		ratio: ratio,
		favorite: false,
		categories: [],
		width: imageSize.width,
		height: imageSize.height,
		type: isVideo ? 'video' : 'image',
		thumbnail: thumbnail,
		duration: isVideo ? await getVideoDuration(filePath) : undefined,
	};
	return metadata;
}

module.exports = {
	getVideoDuration,
	generateVideoThumbnail,
	getImageSize,
	processDirectoryFiles,
}