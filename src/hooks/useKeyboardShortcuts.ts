import { useEffect } from 'react';
import { LocalImageData } from '../types/index.ts';
import { SortDirection } from '../types/index.ts';

interface UseKeyboardShortcutsProps {
  selectedImages: Set<string>;
  setSelectedImages: (images: Set<string>) => void;
  handleBulkDelete: () => void;
  handleFavorite: (id: string) => void;
  handleOpenInEditor: (path: string) => void;
  images: LocalImageData[];
  filteredImages: LocalImageData[];
  searchButtonRef: React.RefObject<HTMLElement>;
  sortButtonRef: React.RefObject<HTMLElement>;
  filterButtonRef: React.RefObject<HTMLElement>;
  setViewMode: React.Dispatch<React.SetStateAction<'grid' | 'list'>>;
  setViewingMedia: (media: LocalImageData | null) => void;
  setRandomInspiration: (inspiration: number | ((prev: number) => number)) => void;
  randomInspiration: number;
  setSortDirection: (direction: SortDirection | ((prev: SortDirection) => SortDirection)) => void;
}

export const useKeyboardShortcuts = ({
  selectedImages,
  setSelectedImages,
  handleBulkDelete,
  handleFavorite,
  handleOpenInEditor,
  images,
  filteredImages,
  searchButtonRef,
  sortButtonRef,
  filterButtonRef,
  setViewMode,
  setViewingMedia,
  setRandomInspiration,
  randomInspiration,
  setSortDirection
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果正在编辑标签或者有对话框打开,不处理快捷键
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'tab': {
          // 只在选中单个图片时处理 Tab 键
          if (selectedImages.size === 1) {
            e.preventDefault(); // 阻止默认的 Tab 行为
            const currentImageId = Array.from(selectedImages)[0];
            const currentIndex = filteredImages.findIndex(img => img.id === currentImageId);
            
            if (currentIndex !== -1) {
              let nextIndex;
              if (e.shiftKey) {
                // Shift + Tab 选择上一张
                nextIndex = currentIndex === 0 ? filteredImages.length - 1 : currentIndex - 1;
              } else {
                // Tab 选择下一张
                nextIndex = currentIndex === filteredImages.length - 1 ? 0 : currentIndex + 1;
              }
              const nextImage = filteredImages[nextIndex];
              setSelectedImages(new Set([nextImage.id]));
              setViewingMedia(nextImage); // 更新右侧图片信息
            }
          }
          break;
        }
        case 'escape':
          setSelectedImages(new Set());
          break;
        case 'delete':
          if (selectedImages.size > 0) {
            handleBulkDelete();
          }
          break;
        case 'a':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            // 全选当前显示的图片
            const newSelected = new Set(filteredImages.map(img => img.id));
            setSelectedImages(newSelected);
          }
          break;
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            // 打开搜索
            searchButtonRef.current?.click();
          }
          break;
        case 'f':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            // 打开搜索
            filterButtonRef.current?.click();
          }
          break;
        case 'g':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            // 切换视图模式
            setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
          }
          break;
        case 'e':
          if ((e.ctrlKey || e.metaKey) && selectedImages.size === 1) {
            e.preventDefault();
            // 在编辑器中打开
            const selectedImage = images.find(img => selectedImages.has(img.id));
            if (selectedImage) {
              handleOpenInEditor(selectedImage.path);
            }
          }
          break;
        case 'o':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            // 切换排序方向
            setSortDirection(prev => prev === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc);
          }
          break;
        case 'h':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            // 添加/移除收藏
            const selectedImage = images.find(img => selectedImages.has(img.id));
            if (selectedImage) {
              handleFavorite(selectedImage.id);
            }
          }
          break;
        case 'r':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (randomInspiration === 0) {
              setRandomInspiration(1);
            } else if (randomInspiration < 10) {
              setRandomInspiration(prev => prev + 1);
            } else {
              setRandomInspiration(0);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedImages,
    setSelectedImages,
    handleBulkDelete,
    handleFavorite,
    handleOpenInEditor,
    images,
    filteredImages,
    searchButtonRef,
    sortButtonRef,
    filterButtonRef,
    setViewMode,
    setViewingMedia,
    setRandomInspiration,
    randomInspiration,
  ]);
}; 