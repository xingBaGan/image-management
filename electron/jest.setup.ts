// jest.setup.ts
import { jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';

const mockUserDataPath = path.join(os.tmpdir(), 'image-management-jest-userData');
fs.mkdirSync(mockUserDataPath, { recursive: true });

// Mock electron
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn((name?: string) => {
      if (name === 'userData') {
        return mockUserDataPath;
      }
      return mockUserDataPath;
    }),
    isPackaged: false, // Ensure this is set to a boolean value
    on: jest.fn(),
    whenReady: jest.fn(() => Promise.resolve()),
  },
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
  },
  BrowserWindow: jest.fn(() => ({
    loadURL: jest.fn(),
    on: jest.fn(),
    show: jest.fn(),
  })),
  dialog: {
    showOpenDialog: jest.fn(),
  },
  shell: {
    openPath: jest.fn(),
    showItemInFolder: jest.fn(),
  }
}));
