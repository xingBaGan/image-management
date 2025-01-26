import React, { useState, useRef } from 'react';
import Masonry from 'react-masonry-css';
import { FileText, Calendar } from 'lucide-react';
import { BaseMedia, Category, Image as ImageType, ViewMode } from '../types';
import MediaViewer from './MediaViewer';
import { handleDrop as handleDropUtil } from '../utils';
import DragOverlay from './DragOverlay';
import ImageItem from './ImageItem';
import VideoItem from './VideoItem';

interface ImageGridProps {
  images: ImageType[];
  onFavorite: (id: string) => void;
  viewMode: ViewMode;
  selectedImages: Set<string>;
  onSelectImage: (id: string, isShiftKey: boolean) => void;
  updateTagsByMediaId: (mediaId: string, newTags: string[]) => void;
  addImages: (newImages: ImageType[]) => void;
  existingImages: ImageType[];
  categories: Category[];
  setIsTagging: (isTagging: boolean) => void;
  isTagging: boolean;
}

const ImageGrid: React.FC<ImageGridProps> = ({
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
  const [viewingMedia, setViewingMedia] = useState<ImageType | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const breakpointColumns = {
    default: 4,
    1536: 3,
    1280: 3,
    1024: 2,
    768: 2,
    640: 1,
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleClick = (e: React.MouseEvent, image: ImageType) => {
    onSelectImage(image.id, e.shiftKey);
  };

  const handleDoubleClick = (e: React.MouseEvent, image: ImageType) => {
    setViewingMedia(image);
  };

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

  const renderMediaItem = (media: ImageType) => {
    const props = {
      isSelected: selectedImages.has(media.id),
      onSelect: (e: React.MouseEvent) => handleClick(e, media),
      onDoubleClick: (e: React.MouseEvent) => handleDoubleClick(e, media),
      onFavorite: onFavorite,
      viewMode,
    };

    return media.type === 'video' ? (
      <VideoItem video={media} {...props} />
    ) : (
      <ImageItem image={media} {...props} />
    );
  };

  if (viewMode === 'list') {
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

        <div className="p-6"
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
          <div className="bg-white bg-opacity-60 rounded-lg shadow dark:bg-gray-800">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 p-4 border-b dark:border-gray-700 font-medium text-gray-500 dark:text-gray-400">
              <div className="w-12"></div>
              <div>Name</div>
              <div>Size</div>
              <div>dateModified</div>
              <div className="w-20">Actions</div>
            </div>
            {images.map((image) => (
              <div
                key={image.id}
                className={`
                  grid 
                  grid-cols-[auto_1fr_auto_auto_auto]
                  gap-4 p-4 items-center
                  hover:bg-gray-50
                  dark:hover:bg-gray-700
                  transition-colors cursor-pointer image-item ${selectedImages.has(image.id) ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                  }`}
                data-image-id={image.id}
                onContextMenu={handleContextMenu}
              >
                {renderMediaItem(image)}
                <div className="flex items-center">
                  <FileText size={16} className="mr-2 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-200">{image.name}</span>
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  {(image.size / 1024 / 1024).toFixed(2)} MB
                </div>
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                  <Calendar size={16} className="mr-2" />
                  {new Date(image.dateModified).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

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
        <Masonry
          breakpointCols={breakpointColumns}
          className="flex -ml-6 [&>*]:will-change-[transform,opacity] [&>*]:transition-all [&>*]:duration-500 [&>*]:ease-[cubic-bezier(0.4,0,0.2,1)]"
          columnClassName="pl-6 space-y-6 [&>*]:will-change-[transform,opacity] [&>*]:transition-all [&>*]:duration-500 [&>*]:ease-[cubic-bezier(0.4,0,0.2,1)]"
        >
          {images.map((image) => (
            <div
              key={image.id}
              className="image-item"
              data-image-id={image.id}
              onContextMenu={handleContextMenu}
            >
              {renderMediaItem(image)}
            </div>
          ))}
        </Masonry>
      </div>
    </>
  );
};

export default ImageGrid;