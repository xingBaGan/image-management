import React, { useEffect } from 'react';
import { X, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { Image as ImageType } from '../types';

interface MediaViewerProps {
  media: ImageType | null;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

const MediaViewer: React.FC<MediaViewerProps> = ({ media, onClose, onPrevious, onNext }) => {
  if (!media) return null;
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && onPrevious) {
        onPrevious();
      } else if (e.key === 'ArrowRight' && onNext) {
        onNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrevious, onNext, onClose]);

  return (
    <div 
      className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-90"
      onClick={handleBackdropClick}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white rounded-full transition-colors hover:bg-white/10"
        title="关闭"
        aria-label="关闭"
      >
        <X size={24} />
      </button>

      {onPrevious && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrevious(); }}
          className="absolute left-4 top-1/2 p-2 text-white rounded-full transition-colors -translate-y-1/2 hover:bg-white/10"
          title="上一张"
          aria-label="上一张"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {onNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 p-2 text-white rounded-full transition-colors -translate-y-1/2 hover:bg-white/10"
          title="下一张"
          aria-label="下一张"
        >
          <ChevronRight size={32} />
        </button>
      )}

      <div className="max-w-[90vw] max-h-[90vh] relative flex flex-col items-center">
        {media.type === 'video' ? (
          <video
            src={media.path}
            controls
            autoPlay
            className="max-w-full max-h-[80vh] rounded-lg"
            poster={media.thumbnail}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={media.path}
            alt={media.name}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
          />
        )}
        
        {media.tags && media.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {media.tags.map((tag, index) => (
              <div
                key={index}
                className="px-3 py-1 bg-white/10 text-white rounded-full flex items-center gap-1.5 text-sm"
              >
                <Tag size={14} />
                <span>{tag}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaViewer; 