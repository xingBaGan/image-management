import React, { useState, useRef, useCallback } from 'react';
import { handleDrop as handleDropUtil } from '../utils';
import DragOverlay from './DragOverlay';
import MediaViewer from './MediaViewer';
import { ImportStatus, LocalImageData } from '../types';
import { ImageGridBaseProps } from './ImageGridBase';
import GridView from './GridView';
import ListView from './ListView';
import { useElectron } from '../hooks/useElectron';

const MediaGrid: React.FC<ImageGridBaseProps> = ({
  images,
  onFavorite,
  viewMode,
  selectedImages,
  onSelectImage,
  updateTagsByMediaId,
  addImages,
  existingImages,
  categories,
  setImportState,
  importState,
}) => {
  const [viewingMedia, setViewingMedia] = useState<LocalImageData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseDownTime, setMouseDownTime] = useState<number>(0);
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number, y: number } | null>(null);
  const { openInEditor } = useElectron();

  const handleTagsUpdate = (mediaId: string, newTags: string[]) => {
    updateTagsByMediaId(mediaId, newTags);
    if (viewingMedia?.id === mediaId) {
      const updatedMedia = images.find(img => img.id === mediaId);
      if (updatedMedia) {
        setViewingMedia({ ...updatedMedia, tags: newTags });
      }
    }
  };

  // 处理鼠标按下事件
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    // if ((e.target as HTMLElement).closest('.image-item')) return;
    
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 记录鼠标按下的时间和位置
    setMouseDownTime(Date.now());
    setMouseDownPos({ x, y });
  };

  // 处理鼠标移动事件
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mouseDownPos) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // 计算鼠标移动距离
    const moveDistance = Math.sqrt(
      Math.pow(currentX - mouseDownPos.x, 2) + 
      Math.pow(currentY - mouseDownPos.y, 2)
    );

    // 如果移动距离超过阈值，开始框选
    if (moveDistance > 5 && !isSelecting) {
      setIsSelecting(true);
      setSelectionStart(mouseDownPos);
      setSelectionEnd({ x: currentX, y: currentY });
    }

    if (isSelecting) {
      setSelectionEnd({ x: currentX, y: currentY });
    }
  };

  // 处理鼠标松开事件
  const handleMouseUp = (e: React.MouseEvent) => {
    const currentTime = Date.now();
    const timeDiff = currentTime - mouseDownTime;

    if (isSelecting) {
      // 如果正在框选，处理框选逻辑
      const selectedIds = getImagesInSelection();
      if (selectedIds.length > 0) {
        selectedIds.forEach(id => onSelectImage(id, true));
      }
    } else if (timeDiff < 200 && mouseDownPos) {
      // 如果是快速点击（小于200ms）且没有明显移动，视为点击事件
      onSelectImage('', false); // 清除选择
    }

    // 重置状态
    setIsSelecting(false);
    setMouseDownPos(null);
  };

  // 获取选择框内的图片
  const getImagesInSelection = () => {
    const container = containerRef.current;
    if (!container) return [];

    const minX = Math.min(selectionStart.x, selectionEnd.x);
    const maxX = Math.max(selectionStart.x, selectionEnd.x);
    const minY = Math.min(selectionStart.y, selectionEnd.y);
    const maxY = Math.max(selectionStart.y, selectionEnd.y);

    const selectedIds: string[] = [];
    const imageElements = container.getElementsByClassName('image-item');
    Array.from(imageElements).forEach((element) => {
      const rect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      const elementX = rect.left - containerRect.left;
      const elementY = rect.top - containerRect.top;

      if (
        elementX < maxX &&
        elementX + rect.width > minX &&
        elementY < maxY &&
        elementY + rect.height > minY
      ) {
        const imageId = element.getAttribute('data-image-id');
        if (imageId) {
          selectedIds.push(imageId);
        }
      }
    });

    return selectedIds;
  };

  // 计算选择框样式
  const getSelectionStyle = () => {
    if (!isSelecting) return undefined;

    const left = Math.min(selectionStart.x, selectionEnd.x);
    const top = Math.min(selectionStart.y, selectionEnd.y);
    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);

    return {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,  
      width: `${width}px`,
      height: `${height}px`,
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      border: '1px solid rgb(59, 130, 246)',
      pointerEvents: 'none',
      zIndex: 10,
    } as React.CSSProperties;
  };

  const isImporting = importState === ImportStatus.Importing || importState === ImportStatus.Tagging;

  const handleOpenInEditor = useCallback((path: string) => {
    openInEditor(path);
  }, [openInEditor]);

  return (
    <div 
      className="media-grid-container relative p-4"
      style={{ height: 'calc(100vh - 4rem)' }}
    >
      {viewingMedia && (
        <MediaViewer
          media={viewingMedia}
          onTagsUpdate={handleTagsUpdate}
          onClose={() => setViewingMedia(null)}
          onPrevious={() => {
            const index = images.findIndex(img => img.id === viewingMedia?.id);
            if (index > 0) {
              setViewingMedia(images[index - 1]);
            }
          }}
          onNext={() => {
            const index = images.findIndex(img => img.id === viewingMedia?.id);
            if (index < images.length - 1) {
              setViewingMedia(images[index + 1]);
            }
          }}
        />
      )}

      <div className="p-6 w-full h-full select-none scroll-smooth"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsSelecting(false);
          setMouseDownPos(null);
        }}
        style={{ position: 'relative', overflow: isImporting || isDragging ? 'hidden' : 'auto' }}
        onDragEnter={() => setIsDragging(true)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => { await handleDropUtil(e, addImages, existingImages, categories, setImportState); setIsDragging(false); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false); }}>
        {isSelecting && <div style={getSelectionStyle()} />}
        <DragOverlay isDragging={isDragging} importState={importState} />
        {viewMode === 'list' ? (
          <ListView {...{
            images,
            onFavorite,
            viewMode,
            selectedImages,
            onSelectImage,
            updateTagsByMediaId,
            addImages,
            existingImages,
            categories,
            setImportState,
            importState,
            setViewingMedia,
            onOpenInEditor: handleOpenInEditor,
          }} />
        ) : (
          <GridView {...{
            images,
            onFavorite,
            viewMode,
            selectedImages,
            onSelectImage,
            updateTagsByMediaId,
            addImages,
            existingImages,
            categories,
            setImportState,
            importState,
            setViewingMedia,
            onOpenInEditor: handleOpenInEditor,
          }} />
        )}
      </div>
    </div>
  );
};

export default MediaGrid;