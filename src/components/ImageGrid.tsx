import React, { useState } from 'react';
import Masonry from 'react-masonry-css';
import { Heart, MoreVertical, FileText, Calendar, Check, Play } from 'lucide-react';
import { Image as ImageType, ViewMode } from '../types';
import MediaViewer from './MediaViewer';

interface ImageGridProps {
  images: ImageType[];
  onFavorite: (id: string) => void;
  viewMode: ViewMode;
  selectedImages: Set<string>;
  onSelectImage: (id: string, isShiftKey: boolean) => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  onFavorite,
  viewMode,
  selectedImages,
  onSelectImage,
}) => {
  const [viewingMedia, setViewingMedia] = useState<ImageType | null>(null);

  const breakpointColumns = {
    default: 4,
    1536: 3,
    1280: 3,
    1024: 2,
    768: 2,
    640: 1,
  };

  const renderMediaItem = (image: ImageType) => {
    if (image.type === 'video') {
      return (
        <div className="relative w-full h-0 pb-[56.25%]">
          <img
            src={image.thumbnail || image.path}
            alt={image.name}
            className="object-cover absolute inset-0 w-full h-full rounded-lg"
          />
          <div className="flex absolute inset-0 justify-center items-center">
            <div className="p-3 bg-black bg-opacity-50 rounded-full">
              <Play className="w-8 h-8 text-white" />
            </div>
          </div>
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
        className="w-full h-auto rounded-lg"
      />
    );
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // 阻止默认右键菜单
    onSelectImage(id, e.shiftKey);
  };

  const handleClick = (e: React.MouseEvent, image: ImageType) => {
    if (e.shiftKey) {
      // 如果按住Shift键，则触发选择功能
      onSelectImage(image.id, true);
    } else if (!e.ctrlKey && !e.metaKey) {
      // 普通点击时预览图片（除非按住Ctrl/Command键）
      setViewingMedia(image);
    }
  };

  if (viewMode === 'list') {
    return (
      <>
        {viewingMedia && (
          <MediaViewer
            media={viewingMedia}
            onClose={() => setViewingMedia(null)}
          />
        )}
        
        <div className="p-6">
          <div className="bg-white rounded-lg shadow dark:bg-gray-800">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 p-4 border-b dark:border-gray-700 font-medium text-gray-500 dark:text-gray-400">
              <div className="w-12"></div>
              <div>Name</div>
              <div>Size</div>
              <div>Modified</div>
              <div className="w-20">Actions</div>
            </div>
            {images.map((image) => (
              <div
                key={image.id}
                className={`grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 p-4 items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                  selectedImages.has(image.id) ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                }`}
                onClick={(e) => handleClick(e, image)}
                onContextMenu={(e) => handleContextMenu(e, image.id)}
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
                    className={`p-2 rounded-full ${
                      image.favorite
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
          onClose={() => setViewingMedia(null)}
        />
      )}
      
      <div className="p-6">
        <Masonry
          breakpointCols={breakpointColumns}
          className="flex -ml-6"
          columnClassName="pl-6"
        >
          {images.map((image) => (
            <div
              key={image.id}
              className={`mb-6 relative group cursor-pointer ${
                selectedImages.has(image.id) ? 'ring-4 ring-blue-500 rounded-lg' : ''
              }`}
              onClick={(e) => handleClick(e, image)}
              onContextMenu={(e) => handleContextMenu(e, image.id)}
            >
              {renderMediaItem(image)}
              <div className={`absolute inset-0 bg-black transition-opacity duration-200 rounded-lg ${
                selectedImages.has(image.id) ? 'bg-opacity-30' : 'bg-opacity-0 group-hover:bg-opacity-30'
              }`} />
              {selectedImages.has(image.id) && (
                <div className="absolute top-4 left-4 p-1 bg-blue-500 rounded-full">
                  <Check className="text-white" size={20} />
                </div>
              )}
              <div className="flex absolute top-4 right-4 items-center space-x-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <button
                  title={image.favorite ? "取消收藏" : "收藏"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFavorite(image.id);
                  }}
                  className={`p-2 rounded-full ${
                    image.favorite
                      ? 'bg-red-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Heart size={20} />
                </button>
                <button
                  title="更多选项"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 text-gray-700 bg-white rounded-full hover:bg-gray-100"
                >
                  <MoreVertical size={20} />
                </button>
              </div>
              <div className="absolute right-0 bottom-0 left-0 p-4 bg-gradient-to-t from-black to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
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