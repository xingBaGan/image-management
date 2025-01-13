"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    readDirectory: function (path) { return electron_1.ipcRenderer.invoke('read-directory', path); },
    readFileMetadata: function (path) { return electron_1.ipcRenderer.invoke('read-file-metadata', path); },
});
