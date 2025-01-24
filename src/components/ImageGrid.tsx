import React, { useState, useRef } from 'react';
import Masonry from 'react-masonry-css';
import { Heart, MoreVertical, FileText, Calendar, Check, Play } from 'lucide-react';
import { BaseImage, Category, Image as ImageType, ViewMode } from '../types';
import MediaViewer from './MediaViewer';
import { handleDrop as handleDropUtil } from '../utils';
import DragOverlay from './DragOverlay';

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
  onRateChange: (mediaId: string, rate: number) => void;
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

  const renderMediaItem = (image: BaseImage) => {
    if (image.type === 'video') {
      return (
        <div className="relative w-full h-0 pb-[56.25%]">
          <video
            src={image.path}
            className="object-cover absolute inset-0 w-full h-full rounded-lg"
            controls
          />
          {image.duration && (
            <div className="absolute right-2 bottom-2 px-2 py-1 text-sm text-white bg-black bg-opacity-50 rounded">
              {Math.floor(image.duration / 60)}:{(image.duration % 60).toString().padStart(2, '0')}
            </div>
          )}
        </div>
      );
    }

    return (
      <img
        src={image.path}
        alt={image.name}
        className="w-full h-auto rounded-2xl"
      />
    );
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // 仅阻止默认右键菜单
  };

  const handleClick = (e: React.MouseEvent, image: ImageType) => {
    // 传递Shift键状态
    onSelectImage(image.id, e.shiftKey);
  };

  const handleDoubleClick = (e: React.MouseEvent, image: ImageType) => {
    // 双击查看图片
    setViewingMedia(image);
  };

  const handleTagsUpdate = (mediaId: string, newTags: string[]) => {
    updateTagsByMediaId(mediaId, newTags);
    // 如果当前正在查看的媒体被更新了，同步更新 viewingMedia
    if (viewingMedia?.id === mediaId) {
      const updatedMedia = images.find(img => img.id === mediaId);
      if (updatedMedia) {
        setViewingMedia({ ...updatedMedia, tags: newTags });
      }
    }
  };

  // 处理鼠标按下事件
  const handleMouseDown = (e: React.MouseEvent) => {
    // 只响应左键
    if (e.button !== 0) return;

    // 如果点击的是图片或按钮，不启动框选
    if ((e.target as HTMLElement).closest('.image-item')) return;

    // 点击空白处时清除所有选中状态
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

    // 获取所有在选择框内的图片
    const selectedIds = getImagesInSelection();
    if (selectedIds.length > 0) {
      // 全部选中
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

    // 获取所有图片元素
    const imageElements = container.getElementsByClassName('image-item');
    Array.from(imageElements).forEach((element) => {
      const rect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      const elementX = rect.left - containerRect.left;
      const elementY = rect.top - containerRect.top;

      // 检查图片是否在选择框内
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
                onClick={(e) => handleClick(e, image)}
                onDoubleClick={(e) => handleDoubleClick(e, image)}
                onContextMenu={handleContextMenu}
              >
                <div className="relative w-12 h-12">
                  {image.type === 'video' ? (
                    <div className="relative w-12 h-12">
                      <img
                        src={image.thumbnail || image.path}
                        alt={image.name}
                        className="object-cover w-12 h-12 rounded"
                      />
                      <div className="flex absolute inset-0 justify-center items-center">
                        <Play className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={image.path}
                      alt={image.name}
                      className="object-cover w-12 h-12 rounded"
                    />
                  )}
                  {selectedImages.has(image.id) && (
                    <div className="flex absolute inset-0 justify-center items-center rounded bg-blue-500/50">
                      <Check className="text-white" size={20} />
                    </div>
                  )}
                </div>
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
                <div className="flex items-center space-x-2">
                  <button
                    title={image.favorite ? "取消收藏" : "收藏"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onFavorite(image.id);
                    }}
                    className={`p-2 rounded-full ${image.favorite
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                  >
                    <Heart size={16} />
                  </button>
                  <button
                    title="更多选项"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 text-gray-700 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <MoreVertical size={16} />
                  </button>
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
              className={`relative group cursor-pointer will-change-transform transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] transform image-item ${selectedImages.has(image.id) ? 'ring-4 ring-blue-500 rounded-lg scale-[0.98]' : 'scale-100'
                }`}
              data-image-id={image.id}
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                perspective: '1000px',
                WebkitPerspective: '1000px'
              }}
              onClick={(e) => handleClick(e, image)}
              onDoubleClick={(e) => handleDoubleClick(e, image)}
              onContextMenu={handleContextMenu}
            >
              {renderMediaItem(image)}
              <div className={`absolute inset-0 bg-black will-change-opacity transition-opacity duration-300 ease-in-out rounded-lg ${selectedImages.has(image.id) ? 'bg-opacity-30' : 'bg-opacity-0 group-hover:bg-opacity-30'
                }`} />
              {selectedImages.has(image.id) && (
                <div className="absolute top-4 left-4 p-1 bg-blue-500 rounded-full transition-transform duration-200 ease-in-out transform scale-100">
                  <Check className="text-white" size={20} />
                </div>
              )}
              <div className="flex absolute top-4 right-4 items-center space-x-2 opacity-0 backdrop-blur-sm transition-all duration-300 ease-in-out transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
                <button
                  title={image.favorite ? "取消收藏" : "收藏"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFavorite(image.id);
                  }}
                  className={`p-2 rounded-full transition-all duration-200 ease-in-out transform hover:scale-110 ${image.favorite
                      ? 'bg-red-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                    } backdrop-blur-sm`}
                >
                  <Heart size={20} />
                </button>
                <button
                  title="更多选项"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 text-gray-700 bg-white rounded-full backdrop-blur-sm transition-all duration-200 ease-in-out transform hover:scale-110 hover:bg-gray-100"
                >
                  <MoreVertical size={20} />
                </button>
              </div>
              <div className="absolute right-0 bottom-0 left-0 p-4 bg-gradient-to-t from-black to-transparent rounded-2xl opacity-0 backdrop-blur-sm transition-all duration-300 ease-in-out transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
                <h3 className="font-medium text-white truncate">{image.name}</h3>
                <p className="text-sm text-gray-300">
                  {new Date(image.dateModified).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </Masonry>
      </div>
    </>
  );
};

export default ImageGrid;