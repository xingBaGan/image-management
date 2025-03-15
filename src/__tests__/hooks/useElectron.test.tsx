import { renderHook, act } from '@testing-library/react';
import { useElectron } from '@/hooks/useElectron';
import { ElectronAPI } from '@/types/index';
import { jest } from '@jest/globals';

// 模拟 window.electron
const mockOpenInEditor = jest.fn() as jest.MockedFunction<ElectronAPI['openInEditor']>;
const mockShowInFolder = jest.fn() as jest.MockedFunction<ElectronAPI['showInFolder']>;

describe('useElectron', () => {
  beforeEach(() => {
    // 设置全局 window.electron
    window.electron = {
      openInEditor: mockOpenInEditor,
      showInFolder: mockShowInFolder,
    } as unknown as ElectronAPI;
    
    // 清除所有模拟函数的调用记录
    jest.clearAllMocks();
    
    // 模拟 console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('openInEditor', () => {
    it('应该成功调用 electron.openInEditor', async () => {
      mockOpenInEditor.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useElectron());

      await act(async () => {
        await result.current.openInEditor('test.psd');
      });

      expect(mockOpenInEditor).toHaveBeenCalledWith('test.psd');
      expect(console.error).not.toHaveBeenCalled();
    });

    it('应该处理 openInEditor 失败的情况', async () => {
      mockOpenInEditor.mockResolvedValue({ success: false, error: 'Failed' });
      const { result } = renderHook(() => useElectron());

      await act(async () => {
        await result.current.openInEditor('test.psd');
      });

      expect(mockOpenInEditor).toHaveBeenCalledWith('test.psd');
      expect(console.error).toHaveBeenCalledWith('Failed to open in Photoshop:', 'Failed');
    });

    it('应该处理 openInEditor 抛出错误的情况', async () => {
      mockOpenInEditor.mockRejectedValue(new Error('Test error'));
      const { result } = renderHook(() => useElectron());

      await act(async () => {
        await result.current.openInEditor('test.psd');
      });

      expect(mockOpenInEditor).toHaveBeenCalledWith('test.psd');
      expect(console.error).toHaveBeenCalledWith('Error opening file in Photoshop:', new Error('Test error'));
    });
  });

  describe('showInFolder', () => {
    it('应该成功调用 electron.showInFolder', async () => {
      mockShowInFolder.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useElectron());

      await act(async () => {
        await result.current.showInFolder('test.psd');
      });

      expect(mockShowInFolder).toHaveBeenCalledWith('test.psd');
      expect(console.error).not.toHaveBeenCalled();
    });

    it('应该处理 showInFolder 失败的情况', async () => {
      mockShowInFolder.mockResolvedValue({ success: false, error: 'Failed' });
      const { result } = renderHook(() => useElectron());

      await act(async () => {
        await result.current.showInFolder('test.psd');
      });

      expect(mockShowInFolder).toHaveBeenCalledWith('test.psd');
      expect(console.error).toHaveBeenCalledWith('Failed to show in folder:', 'Failed');
    });

    it('应该处理 showInFolder 抛出错误的情况', async () => {
      mockShowInFolder.mockRejectedValue(new Error('Test error'));
      const { result } = renderHook(() => useElectron());

      await act(async () => {
        await result.current.showInFolder('test.psd');
      });

      expect(mockShowInFolder).toHaveBeenCalledWith('test.psd');
      expect(console.error).toHaveBeenCalledWith('Error showing file in folder:', new Error('Test error'));
    });
  });
}); 