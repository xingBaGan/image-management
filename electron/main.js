"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path_1 = require("path");
var url_1 = require("url");
var path_2 = require("path");
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = (0, path_2.dirname)(__filename);
var isDev = !electron_1.app.isPackaged;
function createWindow() {
    var mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true, // 改为 true 以增加安全性
            preload: path_1.default.join(__dirname, 'preload.js') // 添加预加载脚本
        }
    });
    // 根据开发环境加载不同的URL
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
}
electron_1.app.whenReady().then(function () {
    createWindow();
    electron_1.app.on('activate', function () {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// 处理文件系统相关的IPC通信
electron_1.ipcMain.handle('read-directory', function (event, dirPath) { return __awaiter(void 0, void 0, void 0, function () {
    var fs, files, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fs = require('fs').promises;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, fs.readdir(dirPath)];
            case 2:
                files = _a.sent();
                return [2 /*return*/, files];
            case 3:
                error_1 = _a.sent();
                console.error('Error reading directory:', error_1);
                throw error_1;
            case 4: return [2 /*return*/];
        }
    });
}); });
electron_1.ipcMain.handle('read-file-metadata', function (event, filePath) { return __awaiter(void 0, void 0, void 0, function () {
    var fs, stats, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fs = require('fs').promises;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, fs.stat(filePath)];
            case 2:
                stats = _a.sent();
                return [2 /*return*/, {
                        size: stats.size,
                        created: stats.birthtime,
                        modified: stats.mtime
                    }];
            case 3:
                error_2 = _a.sent();
                console.error('Error reading file metadata:', error_2);
                throw error_2;
            case 4: return [2 /*return*/];
        }
    });
}); });
