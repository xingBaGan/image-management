// jest.setup.ts
import { jest } from '@jest/globals';

// Mock electron
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => '/mock/path'),
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