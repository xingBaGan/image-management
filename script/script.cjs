"use strict";
const { PythonShell } = require('python-shell');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const { execSync } = require('child_process');
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
const normalizeImagePath = (inputPath) => {
    if (!inputPath) {
        throw new Error("Image path is required");
    }
    if (inputPath.startsWith("file://")) {
        return inputPath.replace("file://", "");
    }
    return inputPath;
};
async function tagImage(imagePath, modelName) {
    const model_dir_path = isDev ? path.join(__dirname, '../models') : path.join(process.resourcesPath, 'models');
    const tag_path = isDev ? path.join(__dirname, './ai_tagger.py') : path.join(process.resourcesPath, 'script', 'ai_tagger.py');
    options.scriptPath = path.dirname(tag_path);
    options.args = [imagePath, modelName, model_dir_path];
    try {
        const result = await PythonShell.run(path.basename(tag_path), options);
        if (result.length < 2) {
            return [];
        }
        return result[2].split(delimiter);
    }
    catch (err) {
        console.error('AI标注出错:', err);
        return ['AI标注出错: ' + err.message];
    }
}
async function getMainColor(imagePath) {
    const color_path = isDev ? path.join(__dirname, './get_main_color.py') : path.join(process.resourcesPath, 'script', 'get_main_color.py');
    options.scriptPath = path.dirname(color_path);
    options.args = [imagePath];
    try {
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
    catch (err) {
        console.error('主色提取出错:', err);
        return ['主色提取出错: ' + err.message];
    }
}
async function checkEnvironment() {
    const checks = {
        python: false,
        pip: false,
        venv: false,
        models: false,
        venvPackages: false
    };
    try {
        // 检查 Python 是否安装
        try {
            const pythonVersion = execSync('python --version').toString();
            checks.python = pythonVersion.includes('Python 3');
        }
        catch (err) {
            console.error('Python check failed:', err.message);
        }
        // 检查 pip 是否安装
        try {
            const pipVersion = execSync('pip --version').toString();
            checks.pip = pipVersion.includes('pip');
        }
        catch (err) {
            console.error('pip check failed:', err.message);
        }
        // 检查 venv 是否可用
        try {
            const venvCheck = execSync('python -c "import venv"').toString();
            checks.venv = true;
        }
        catch (err) {
            console.error('venv check failed:', err.message);
        }
        // 检查虚拟环境是否存在且包含必要的包
        const venvPath = isDev ? path.join(__dirname, '../venv') : path.join(process.resourcesPath, 'venv');
        if (fs.existsSync(venvPath)) {
            const venvPython = isMac
                ? path.join(venvPath, 'bin/python3')
                : path.join(venvPath, 'Scripts/python.exe');
            if (fs.existsSync(venvPython)) {
                try {
                    // 检查关键包是否安装
                    const packages = ['numpy', 'requests'];
                    for (const pkg of packages) {
                        execSync(`${venvPython} -c "import ${pkg}"`);
                    }
                    checks.venvPackages = true;
                }
                catch (err) {
                    console.error('venv packages check failed:', err.message);
                }
            }
        }
        // 检查模型文件是否存在
        const modelPath = isDev ? path.join(__dirname, '../models') : path.join(process.resourcesPath, 'models');
        const requiredModels = [
            'wd-v1-4-convnext-tagger-v2',
            'wd-v1-4-convnextv2-tagger-v2'
        ];
        try {
            const modelFiles = fs.readdirSync(modelPath);
            checks.models = requiredModels.every(model => modelFiles.some(file => file.includes(model)));
        }
        catch (err) {
            console.error('models check failed:', err.message);
        }
        // 计算完整性百分比
        const totalChecks = Object.keys(checks).length;
        const passedChecks = Object.values(checks).filter(Boolean).length;
        const completeness = (passedChecks / totalChecks) * 100;
        return {
            checks,
            completeness,
            needsInstall: completeness < 100
        };
    }
    catch (err) {
        console.error('Environment check failed:', err.message);
        return {
            checks,
            completeness: 0,
            needsInstall: true
        };
    }
}
async function installEnvironment() {
    const platform = process.platform;
    let scriptPath;
    let scriptName;
    // Determine which installation script to use based on platform
    if (platform === 'win32') {
        scriptName = 'install.bat';
    }
    else if (platform === 'darwin') {
        scriptName = 'install.command';
    }
    else {
        scriptName = 'install.sh';
    }
    // Get the absolute path to the installation script
    scriptPath = isDev
        ? path.join(__dirname, '..', scriptName)
        : path.join(process.resourcesPath, scriptName);
    // Check if the script exists
    if (!fs.existsSync(scriptPath)) {
        throw new Error(`Installation script not found: ${scriptPath}`);
    }
    return new Promise((resolve, reject) => {
        let process;
        // 根据不同平台使用不同的终端打开方式
        if (platform === 'win32') {
            // Windows: 使用 start cmd.exe 并在脚本执行完后自动退出
            process = spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/c', `${scriptPath} && exit`], {
                shell: true,
                detached: true
            });
        }
        else if (platform === 'darwin') {
            // macOS: 使用 osascript 来控制 Terminal
            const script = `
                tell application "Terminal"
                    do script "\"${scriptPath}\" && exit"
                    activate
                end tell
            `;
            process = spawn('osascript', ['-e', script], {
                shell: true,
                detached: true
            });
        }
        else {
            // Linux: 使用 x-terminal-emulator 或其他终端模拟器
            const terminals = [
                'x-terminal-emulator',
                'gnome-terminal',
                'konsole',
                'xfce4-terminal',
                'xterm'
            ];
            let terminalCmd = null;
            for (const term of terminals) {
                try {
                    execSync(`which ${term}`);
                    terminalCmd = term;
                    break;
                }
                catch (e) {
                    continue;
                }
            }
            if (!terminalCmd) {
                reject(new Error('No terminal emulator found'));
                return;
            }
            // 根据不同的终端使用不同的命令
            if (terminalCmd === 'gnome-terminal') {
                process = spawn(terminalCmd, ['--', 'bash', '-c', `${scriptPath}; read -p "Installation complete. Press enter to exit..." && exit`], {
                    shell: true,
                    detached: true
                });
            }
            else if (terminalCmd === 'konsole') {
                process = spawn(terminalCmd, ['-e', 'bash', '-c', `${scriptPath}; read -p "Installation complete. Press enter to exit..." && exit`], {
                    shell: true,
                    detached: true
                });
            }
            else {
                process = spawn(terminalCmd, ['-e', `bash -c "${scriptPath}; read -p 'Installation complete. Press enter to exit...' && exit"`], {
                    shell: true,
                    detached: true
                });
            }
        }
        // 分离子进程，让它在新窗口中独立运行
        process.on('error', (err) => {
            reject(new Error(`Failed to start installation process: ${err.message}`));
        });
        process.on('close', (code) => {
            resolve(true);
        });
        process.unref();
    });
}
async function readImageMetadata(imagePath) {
    const metadata_path = isDev ? path.join(__dirname, './read_image_metadata.py') : path.join(process.resourcesPath, 'script', 'read_image_metadata.py');
    options.scriptPath = path.dirname(metadata_path);
    try {
        const normalizedPath = normalizeImagePath(imagePath);
        options.args = [normalizedPath];
        const result = await PythonShell.run(path.basename(metadata_path), options);
        if (result && result.length > 0) {
            // 解析 JSON 输出
            const jsonStr = result.join('');
            const metadata = JSON.parse(jsonStr);
            // 如果返回的是错误对象，返回 null
            if (metadata && metadata.error) {
                console.log("Image metadata parsing failed:", metadata.error);
                return null;
            }
            return metadata;
        }
        return null;
    }
    catch (error) {
        // 如果解析失败（例如图片没有特定格式的元数据），返回 null 而不是抛出错误
        // 这样可以避免影响其他处理流程
        console.log("Image metadata parsing failed (this is normal for images without specific metadata formats):", imagePath);
        return null;
    }
}
module.exports = {
    tagImage,
    getMainColor,
    installEnvironment,
    checkEnvironment,
    readImageMetadata
};
