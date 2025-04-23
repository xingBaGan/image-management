import { act, renderHook, waitFor } from '@testing-library/react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { LocalImageData } from '@/types/index.ts';
import { jest } from '@jest/globals';

describe('useKeyboardShortcuts', () => {
  // 模拟数据和回调函数
  const mockImages: LocalImageData[] = [
    {
      "id": "2178bb94",
      "ratio": "9:16",
      "path": "local-image://C:\\Users\\jzj\\Pictures\\test4.jpg",
      "name": "test4.jpg",
      "extension": "jpg",
      "size": 174608,
      "dateCreated": "2025-03-15T07:32:06.768Z",
      "dateModified": "2025-02-15T01:12:37.641Z",
      "tags": [],
      "favorite": false,
      "categories": [],
      "type": "image",
      "width": 768,
      "height": 1453,
      "colors": []
    },
    {
      "id": "3c45ccae",
      "ratio": "4:3",
      "path": "local-image://C:\\Users\\jzj\\Pictures\\test.png",
      "name": "test.png",
      "extension": "png",
      "size": 664273,
      "dateCreated": "2025-03-15T07:32:06.767Z",
      "dateModified": "2025-02-15T01:12:37.640Z",
      "tags": [],
      "favorite": false,
      "categories": [],
      "type": "image",
      "width": 1024,
      "height": 768,
      "colors": []
    }
  ];

  const mockProps = {
    selectedImages: new Set<string>(),
    setSelectedImages: jest.fn(),
    handleBulkDelete: jest.fn(),
    handleFavorite: jest.fn(),
    handleOpenInEditor: jest.fn(),
    images: mockImages,
    filteredImages: mockImages,
    searchButtonRef: { current: document.createElement('button') },
    sortButtonRef: { current: document.createElement('button') },
    filterButtonRef: { current: document.createElement('button') },
    setViewMode: jest.fn(),
    setViewingMedia: jest.fn(),
    setRandomInspiration: jest.fn(),
    randomInspiration: 0,
    setSortDirection: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const simulateKeyDown = (key: string, ctrlKey = false, shiftKey = false) => {
    const event = new KeyboardEvent('keydown', {
      key,
      ctrlKey,
      shiftKey,
      bubbles: true,
    });
    window.dispatchEvent(event);
  };

  it('应该在按下 Escape 时清除选择', () => {
    mockProps.selectedImages = new Set(['1']);
    renderHook(() => useKeyboardShortcuts(mockProps));

    simulateKeyDown('Escape');
    expect(mockProps.setSelectedImages).toHaveBeenCalledWith(new Set());
  });

  it('应该在按下 Delete 时删除选中的图片', () => {
    mockProps.selectedImages = new Set(['1']);
    renderHook(() => useKeyboardShortcuts(mockProps));

    simulateKeyDown('Delete');
    expect(mockProps.handleBulkDelete).toHaveBeenCalled();
  });

  it('应该在按下 Ctrl+A 时全选图片', () => {
    renderHook(() => useKeyboardShortcuts(mockProps));

    simulateKeyDown('a', true);
    expect(mockProps.setSelectedImages).toHaveBeenCalledWith(
      new Set(mockImages.map(img => img.id))
    );
  });

  it('应该在按下 Tab 时选择下一张图片', async () => {
    mockProps.selectedImages = new Set(['2178bb94']);
    renderHook(() => useKeyboardShortcuts(mockProps));
    act(() => {
      simulateKeyDown('Tab');
    });
    await waitFor(() => {
      expect(mockProps.setSelectedImages).toHaveBeenCalledWith(new Set(['3c45ccae']));
      expect(mockProps.setViewingMedia).toHaveBeenCalledWith(mockImages[1]);
    });
  });

  it('应该在按下 Shift+Tab 时选择上一张图片', async () => {
    mockProps.selectedImages = new Set(['3c45ccae']);
    renderHook(() => useKeyboardShortcuts(mockProps));
    act(() => {
      simulateKeyDown('Tab', false, true);
    });
    await waitFor(() => {
      expect(mockProps.setSelectedImages).toHaveBeenCalledWith(new Set(['2178bb94']));
      expect(mockProps.setViewingMedia).toHaveBeenCalledWith(mockImages[0]);
    });
  });

  it('应该在按下 Ctrl+S 时触发搜索按钮点击', () => {
    const mockClick = jest.fn();
    mockProps.searchButtonRef.current.click = mockClick;
    renderHook(() => useKeyboardShortcuts(mockProps));

    simulateKeyDown('s', true);
    expect(mockClick).toHaveBeenCalled();
  });

  it('应该在按下 Ctrl+G 时切换视图模式', () => {
    renderHook(() => useKeyboardShortcuts(mockProps));

    simulateKeyDown('g', true);
    expect(mockProps.setViewMode).toHaveBeenCalled();
  });

  it('应该在按下 Ctrl+E 时在编辑器中打开图片', () => {
    mockProps.selectedImages = new Set(['2178bb94']);
    renderHook(() => useKeyboardShortcuts(mockProps));

    simulateKeyDown('e', true);
    expect(mockProps.handleOpenInEditor).toHaveBeenCalledWith('local-image://C:\\Users\\jzj\\Pictures\\test4.jpg');
  });

  it('应该在按下 Ctrl+H 时切换收藏状态', async () => {
    mockProps.selectedImages = new Set(['3c45ccae']);
    renderHook(() => useKeyboardShortcuts(mockProps));

    act(() => {
      simulateKeyDown('h', true);
    });

    await waitFor(() => {
      expect(mockProps.handleFavorite).toHaveBeenCalledWith('3c45ccae');
    });
  });

  it('不应该在输入框聚焦时处理快捷键', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    
    renderHook(() => useKeyboardShortcuts(mockProps));

    simulateKeyDown('a', true);
    expect(mockProps.setSelectedImages).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });
}); 