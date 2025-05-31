import React, { useEffect, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { useLocale } from '../contexts/LanguageContext';

export interface MediaInfo {
  id: string;
  name: string;
  path: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  tags?: string[];
  url?: string;
}

interface Position {
  x: number;
  y: number;
}

interface MediaViewerProps {
  media: MediaInfo;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onTagsUpdate?: (mediaId: string, newTags: string[]) => void;
}

const MediaViewer: React.FC<MediaViewerProps> = ({
  media,
  onClose,
  onPrevious,
  onNext,
  onTagsUpdate,
}) => {
  const { t } = useLocale();
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          onPrevious?.();
          break;
        case 'ArrowRight':
          onNext?.();
          break;
        case 'Escape':
          onClose();
          break;
        case '+':
          setScale(prev => Math.min(prev + 0.25, 3));
          break;
        case '-':
          setScale(prev => Math.max(prev - 0.25, 0.5));
          break;
        case 'r':
          setRotation(prev => (prev + 90) % 360);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrevious, onNext, onClose]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    // 可以添加错误处理逻辑
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // 只响应左键
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY * -0.01;
    const newScale = Math.max(0.6, Math.min(3, scale + delta));
    setScale(newScale);
  };

  useEffect(() => {
    // 重置位置和缩放当媒体改变时
    setPosition({ x: 0, y: 0 });
    setScale(1);
    setRotation(0);
  }, [media.id]);

  useEffect(() => {
    const temp = document.body.style.overflow;
    // 组件挂载时禁用滚动
    document.body.style.overflow = 'hidden';
    
    // 组件卸载时恢复滚动
    return () => {
      document.body.style.overflow = temp;
    };
  }, []);

  return (
    <div 
      className="flex fixed inset-0 z-50 justify-center items-center bg-black/90"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="flex absolute top-4 right-4 gap-2">
        <button
          onClick={() => setScale(prev => Math.min(prev + 0.25, 3))}
          className="p-2 text-white rounded-full transition-colors hover:bg-white/10"
          title={t('zoomIn')}
        >
          <ZoomIn size={24} />
        </button>
        <button
          onClick={() => setScale(prev => Math.max(prev - 0.25, 0.5))}
          className="p-2 text-white rounded-full transition-colors hover:bg-white/10"
          title={t('zoomOut')}
        >
          <ZoomOut size={24} />
        </button>
        <button
          onClick={() => setRotation(prev => (prev + 90) % 360)}
          className="p-2 text-white rounded-full transition-colors hover:bg-white/10"
          title={t('rotate')}
        >
          <RotateCw size={24} />
        </button>
        <button
          onClick={onClose}
          className="p-2 text-white rounded-full transition-colors hover:bg-white/10"
          title={t('close')}
        >
          <X size={24} />
        </button>
      </div>

      {onPrevious && (
        <button
          onClick={onPrevious}
          className="absolute left-4 top-1/2 p-2 text-white rounded-full transition-colors -translate-y-1/2 hover:bg-white/10"
          title={t('previous')}
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {onNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 p-2 text-white rounded-full transition-colors -translate-y-1/2 hover:bg-white/10"
          title={t('next')}
        >
          <ChevronRight size={32} />
        </button>
      )}

      <div 
        ref={containerRef}
        className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onWheel={handleWheel}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {isLoading && (
          <div className="flex absolute inset-0 justify-center items-center">
            <div className="w-8 h-8 rounded-full border-4 border-white animate-spin border-t-transparent"></div>
          </div>
        )}
        
        {media.type === 'video' ? (
          <video
            src={media.url || media.path}
            controls
            autoPlay
            className="max-w-full max-h-[80vh] rounded-lg"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease'
            }}
          >
            {t('videoNotSupported')}
          </video>
        ) : (
          <img
            src={media.url || media.path}
            alt={media.name}
            className="max-w-full max-h-[80vh] object-contain rounded-lg select-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease'
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            draggable={false}
          />
        )}
      </div>

      {media.tags && media.tags.length > 0 && (
        <div className="absolute bottom-4 left-1/2 px-4 py-2 rounded-full -translate-x-1/2 bg-black/50">
          <div className="flex gap-2">
            {media.tags.map((tag, index) => (
              <span key={index} className="text-sm text-white">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaViewer; 