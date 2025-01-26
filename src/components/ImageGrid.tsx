import React, { useState, useRef } from 'react';
import { handleDrop as handleDropUtil } from '../utils';
import DragOverlay from './DragOverlay';
import MediaViewer from './MediaViewer';
import { LocalImageData } from '../types';
import { ImageGridBaseProps } from './ImageGridBase';
import GridView from './GridView';
import ListView from './ListView';

const ImageGrid: React.FC<ImageGridBaseProps> = ({
  images,
  onFavorite,
  viewMode,
  selectedImages,
  onSelectImage,
  updateTagsByMediaId,
  addImages,
  existingImages,
  categories,
  setIsTagging,
  isTagging,
}) => {
  const [viewingMedia, setViewingMedia] = useState<LocalImageData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

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
    if ((e.target as HTMLElement).closest('.image-item')) return;
    onSelectImage('', false);

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsSelecting(true);
    setSelectionStart({ x, y });
    setSelectionEnd({ x, y });
  };

  // 处理鼠标移动事件
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setSelectionEnd({ x, y });
  };

  // 处理鼠标松开事件
  const handleMouseUp = () => {
    if (!isSelecting) return;
    const selectedIds = getImagesInSelection();
    if (selectedIds.length > 0) {
      selectedIds.forEach(id => onSelectImage(id, true));
    }
    setIsSelecting(false);
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
      position: 'absolute',
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

  return (
    <>
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
        onMouseLeave={() => setIsSelecting(false)}
        style={{ position: 'relative' }}
        onDragEnter={() => setIsDragging(true)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => { await handleDropUtil(e, addImages, existingImages, categories, setIsTagging); setIsDragging(false); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false); }}>
        {isSelecting && <div style={getSelectionStyle()} />}
        <DragOverlay isDragging={isDragging} isTagging={isTagging} />
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
            setIsTagging,
            isTagging,
            setViewingMedia,
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
            setIsTagging,
            isTagging,
            setViewingMedia,
          }} />
        )}
      </div>
    </>
  );
};

export default ImageGrid;