"use strict";
const { PythonShell } = require('python-shell');
const path = require('path');
// 判断是否是开发环境
const isDev = !process?.env?.npm_lifecycle_script ? false : process.env.npm_lifecycle_script.includes('development');
console.log('isDev: %j', isDev);
const isMac = process.platform === 'darwin';
const pythonName = isMac ? 'bin/python3' : 'Scripts/python.exe';
const pythonPath = isDev
    ? path.join(__dirname, `../venv/${pythonName}`)
    : path.join(process.resourcesPath, 'venv', pythonName);
console.log('pythonPath: %j', pythonPath);
let options = {
    mode: 'text',
    pythonPath: pythonPath,
    pythonOptions: ['-u'], // get print results in real-time
    scriptPath: './',
    args: []
};
const delimiter = ', ';
async function tagImage(imagePath, modelName) {
    const model_dir_path = isDev ? path.join(__dirname, '../models') : path.join(process.resourcesPath, 'models');
    const tag_path = isDev ? path.join(__dirname, './ai_tagger.py') : path.join(process.resourcesPath, 'script', 'ai_tagger.py');
    options.scriptPath = path.dirname(tag_path);
    options.args = [imagePath, modelName, model_dir_path];
    const result = await PythonShell.run(path.basename(tag_path), options);
    return result[2].split(delimiter);
}
async function getMainColor(imagePath) {
    const color_path = isDev ? path.join(__dirname, './get_main_color.py') : path.join(process.resourcesPath, 'script', 'get_main_color.py');
    options.scriptPath = path.dirname(color_path);
    options.args = [imagePath];
    let result = await PythonShell.run(path.basename(color_path), options);
    // console.log('result', result)
    /**
     * ["[{'color': '#bdb87d', 'percentage': np.float64(18.3)},
     * {'color': '#eff0e7', 'percentage': np.float64(16.44)},
     * {'color': '#90c1eb', 'percentage': np.float64(12.75)},
     * {'color': '#7c6648', 'percentage': np.float64(12.65)}
     * ]"'
     * 转为
     * [{color: '#bdb87d', percentage: 18.3},
     * {color: '#eff0e7', percentage: 16.44},
     * {color: '#90c1eb', percentage: 12.75},
     * {color: '#7c6648', percentage: 12.65}
     * ]
     */
    result = result[1].replaceAll('np.float64(', '').replaceAll(')', '').replaceAll('\'', '"');
    result = JSON.parse(result);
    return result;
}
module.exports = {
    tagImage,
    getMainColor
};
