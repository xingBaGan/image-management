import React from 'react';
import { X } from 'lucide-react';
import { Image as ImageType } from '../types';

interface MediaViewerProps {
  media: ImageType | null;
  onClose: () => void;
}

const MediaViewer: React.FC<MediaViewerProps> = ({ media, onClose }) => {
  if (!media) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-90"
      onClick={handleBackdropClick}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white rounded-full transition-colors hover:bg-white/10"
      >
        <X size={24} />
      </button>

      <div className="max-w-[90vw] max-h-[90vh] relative">
        {media.type === 'video' ? (
          <video
            src={media.path}
            controls
            autoPlay
            className="max-w-full max-h-[90vh] rounded-lg"
            poster={media.thumbnail}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={media.path}
            alt={media.name}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        )}
      </div>
    </div>
  );
};

export default MediaViewer; 