const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const fsPromises = require('fs').promises;

const getSettingsPath = () => {
	return path.join(app.getPath('userData'), 'settings.json');
};


// 加载设置
const loadSettings = async () => {
	try {
		const settingsPath = getSettingsPath();
		if (!fs.existsSync(settingsPath)) {
			const defaultSettings = {
				autoTagging: true,
				autoColor: false,
				ComfyUI_URL: 'http://localhost:8188',
				backgroundUrl: 'https://picgo-1300491698.cos.ap-nanjing.myqcloud.com/%E8%8D%89%E5%8E%9F%E7%89%9B%E5%9B%BE%E7%94%9F%E6%88%90.png',
				modelName: 'wd-v1-4-moat-tagger-v2'
			};
			console.log('不存在文件, 创建文件');
			await fsPromises.writeFile(
				settingsPath,
				JSON.stringify(defaultSettings, null, 2),
				'utf8' // 修正编码为 'utf8'
			);
			return defaultSettings;
		}
		const data = await fsPromises.readFile(settingsPath, 'utf8');
		return JSON.parse(data);
	} catch (error) {
		console.error('加载设置失败:', error);
		return {
			autoTagging: false, // 返回默认值以防止空对象
			ComfyUI_URL: ''
		};
	}
};

// 保存设置
const saveSettings = async (settings) => {
	try {
		const settingsPath = getSettingsPath();
		await fsPromises.writeFile(
			settingsPath,
			JSON.stringify(settings, null, 2),
			'utf8'
		);
		return true;
	} catch (error) {
		console.error('保存设置失败:', error);
		return false;
	}
};


const initializeSettings = async () => {
	const settings = await loadSettings();
	if (settings.ComfyUI_URL) {
		return settings.ComfyUI_URL;
	}
};

module.exports = {
	initializeSettings,
	loadSettings,
	saveSettings,
};