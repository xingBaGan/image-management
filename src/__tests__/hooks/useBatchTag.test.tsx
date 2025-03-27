import { renderHook, act, waitFor } from '@testing-library/react';
import { toast } from 'react-toastify';
import useBatchTag from '../../hooks/useBatchTag';
import { LocalImageData } from '../../types';

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockT = jest.fn() as any;
const mockHandleBatchTagImages = jest.fn();

describe('useBatchTag', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should open and close tag popup', () => {
    const { result } = renderHook(() => useBatchTag({
      selectedImages: [], 
      t: mockT,
      handleBatchTagImages: mockHandleBatchTagImages,
    }));

    expect(result.current.isTagPopupOpen).toBe(false);

    act(() => {
      result.current.openTagPopup();
    });
    expect(result.current.isTagPopupOpen).toBe(true);

    act(() => {
      result.current.closeTagPopup();  
    });
    expect(result.current.isTagPopupOpen).toBe(false);
  });

  it('should open and close confirm dialog', () => {
    const { result } = renderHook(() => useBatchTag({
      selectedImages: [],
      t: mockT, 
      handleBatchTagImages: mockHandleBatchTagImages,
    }));

    expect(result.current.isConfirmDialogOpen).toBe(false);

    act(() => {
      result.current.openConfirmDialog();
    });
    expect(result.current.isConfirmDialogOpen).toBe(true);

    act(() => {
      result.current.closeConfirmDialog();
    });  
    expect(result.current.isConfirmDialogOpen).toBe(false);
  });

  it('should set and clear batch tag names', () => {
    const { result } = renderHook(() => useBatchTag({
      selectedImages: [],
      t: mockT,
      handleBatchTagImages: mockHandleBatchTagImages,  
    }));

    expect(result.current.batchTagNames).toEqual([]);

    act(() => {
      result.current.setBatchTagNames(['tag1', 'tag2']);
    });
    expect(result.current.batchTagNames).toEqual(['tag1', 'tag2']);

    act(() => {
      result.current.setBatchTagNames([]);
    });
    expect(result.current.batchTagNames).toEqual([]);
  });

  it('should handle batch tagging success', async () => {
    const selectedImages: LocalImageData[] = [
      { id: '1', type: 'image', tags: [], colors: [], name: 'image1.jpg', url: '', size: 0, width: 0, height: 0, path: '', dateCreated: '', dateModified: '', extension: '' },
      { id: '2', type: 'image', tags: [], colors: [], name: 'image2.jpg', url: '', size: 0, width: 0, height: 0, path: '', dateCreated: '', dateModified: '', extension: '' },
    ];
    
    const { result } = renderHook(() => useBatchTag({
      selectedImages,
      t: mockT,
      handleBatchTagImages: mockHandleBatchTagImages,
    }));

    await act(async () => {
      result.current.openConfirmDialog();
      result.current.setBatchTagNames(['tag1', 'tag2']);
    });

    await waitFor(() => {
      expect(result.current.batchTagNames).toEqual(['tag1', 'tag2']);
    });

    await act(async () => {
      result.current.handleBatchTag();
    });

    await waitFor(() => {
      expect(mockHandleBatchTagImages).toHaveBeenCalledWith(
        ['1', '2'],
        ['tag1', 'tag2']
      );
      expect(toast.success).toHaveBeenCalled();
    });

    expect(mockHandleBatchTagImages).toHaveBeenCalledWith(
      ['1', '2'],
      ['tag1', 'tag2']
    );
    expect(toast.success).toHaveBeenCalled();
    expect(result.current.isTagPopupOpen).toBe(false);
    expect(result.current.batchTagNames).toEqual([]);
  });

  it('should handle batch tagging error', async () => {
    mockHandleBatchTagImages.mockRejectedValueOnce(new Error('error'));

    const { result } = renderHook(() => useBatchTag({
      selectedImages: [{ id: '1', type: 'image', tags: [], colors: [], name: 'image1.jpg', url: '', size: 0, width: 0, height: 0, path: '', dateCreated: '', dateModified: '', extension: '' }],
      t: mockT,
      handleBatchTagImages: mockHandleBatchTagImages,
    }));

    await act(async () => {
      result.current.openConfirmDialog();
      await result.current.handleBatchTag();  
    });

    expect(toast.error).toHaveBeenCalled();
  });
}); 