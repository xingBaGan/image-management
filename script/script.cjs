const { PythonShell } = require('python-shell')
const path = require('path')

// 判断是否是开发环境
const isDev = process.env.npm_lifecycle_script.includes('development');
console.log('isDev: %j', isDev)
const pythonPath = isDev 
  ? path.join(__dirname, '../venv/Scripts/python.exe')
  : path.join(process.resourcesPath, 'venv', 'Scripts', 'python.exe');

console.log('pythonPath: %j', pythonPath)
let options = {
  mode: 'text',
  pythonPath: pythonPath,
  pythonOptions: ['-u'], // get print results in real-time
  scriptPath: './',
  args: []
};
const delimiter = ', '
async function tagImage(imagePath, modelName) {
  options.args = [imagePath, modelName]
  const tag_path = isDev? path.join(__dirname, 'ai_tagger.py') : path.join(process.resourcesPath, 'script', 'ai_tagger.py')
  const result = await PythonShell.run(tag_path, options)
  return result[2].split(delimiter);
}

module.exports = {
  tagImage
}

// tagImage("C:/Users/jzj/Pictures/爱壁纸UWP/风景/风景 - 6.jpg", "wd-v1-4-moat-tagger-v2");