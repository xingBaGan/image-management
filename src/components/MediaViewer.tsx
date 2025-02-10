import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaInfo } from '../types';
import { useLocale } from '../contexts/LanguageContext';

interface MediaViewerProps {
  media: MediaInfo;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onTagsUpdate: (mediaId: string, newTags: string[]) => void;
}

const MediaViewer: React.FC<MediaViewerProps> = ({
  media,
  onClose,
  onPrevious,
  onNext,
}) => {
  const { t } = useLocale();

  if (!media) return null;

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
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white rounded-full transition-colors hover:bg-white/10"
        title={t('close')}
        aria-label={t('close')}
      >
        <X size={24} />
      </button>

      {onPrevious && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrevious(); }}
          className="absolute left-4 top-1/2 p-2 text-white rounded-full transition-colors -translate-y-1/2 hover:bg-white/10"
          title={t('previous')}
          aria-label={t('previous')}
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {onNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 p-2 text-white rounded-full transition-colors -translate-y-1/2 hover:bg-white/10"
          title={t('next')}
          aria-label={t('next')}
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
            {t('videoNotSupported')}
          </video>
        ) : (
          <img
            src={media.path}
            alt={media.name}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
          />
        )}
      </div>
    </div>
  );
};

export default MediaViewer; 