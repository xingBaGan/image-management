import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Play, Check } from 'lucide-react';
import type { LocalImageData } from '../types/index.ts';
import throttle from 'lodash/throttle';
import { useLocale } from '../contexts/LanguageContext';

interface VideoItemProps {
  video: LocalImageData & { type: 'video'; duration?: number; thumbnail?: string };
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onFavorite: (id: string) => void;
  viewMode: 'grid' | 'list';
}

const THROTTLE_TIME = 400;

const VideoItem: React.FC<VideoItemProps> = memo(({
  video,
  isSelected,
  onSelect,
  onDoubleClick,
  viewMode
}) => {
  const { t } = useLocale();
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    if (video.width && video.height) {
      setAspectRatio(video.width / video.height);
    }
  }, [video.width, video.height]);

  // 预加载视频元数据
  useEffect(() => {
    if (videoRef.current && !isVideoLoaded) {
      const handleLoadedMetadata = () => {
        setIsVideoLoaded(true);
      };
      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        videoRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [isVideoLoaded]);

  const handleMouseEnter = useCallback(() => {
    if (videoRef.current && isVideoLoaded) {
      videoRef.current.muted = true;
      setIsHovering(true);
      videoRef.current.play().catch(() => {
        console.log(t('autoplayBlocked'));
      });
    }
  }, [isVideoLoaded, t]);

  const handleMouseLeave = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsHovering(false);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isHovering || !videoRef.current || !containerRef.current || !video.duration || !isVideoLoaded) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, x / rect.width));

    videoRef.current.currentTime = video.duration * progress;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {
        console.log(t('autoplayBlocked'));
      });
    }
  }, [isHovering, video.duration, isVideoLoaded, videoRef, t]);


  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = video.path;
    }
  }, [video.path]);

  const throttledHandleMouseMove = useMemo(
    () => throttle(handleMouseMove, THROTTLE_TIME, { leading: true, trailing: true }),
    [handleMouseMove]
  );

  useEffect(() => {
    return () => {
      throttledHandleMouseMove.cancel();
    };
  }, [throttledHandleMouseMove]);

  const progress = useMemo(() => {
    return `${((currentTime || 0) / (video.duration || 1)) * 100}%`;
  }, [currentTime, video.duration]);

  if (viewMode === 'list') {
    return (
      <div className="relative w-12 h-12">
        <img
          src={video.thumbnail || video.path}
          alt={video.name}
          className="object-cover w-12 h-12 rounded"
          loading="lazy"
        />
        <div className="flex absolute inset-0 justify-center items-center" onClick={onDoubleClick}>
          <Play className="w-4 h-4 text-white" />
        </div>
        {isSelected && (
          <div className="flex absolute inset-0 justify-center items-center rounded bg-blue-500/50">
            <Check className="text-white" size={20} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative group cursor-pointer will-change-transform transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] transform ${
        isSelected ? 'ring-4 ring-blue-500 rounded-lg scale-[0.98]' : 'scale-100'
      }`}
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        perspective: '1000px',
        WebkitPerspective: '1000px'
      }}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={isHovering ? throttledHandleMouseMove : undefined}
    >
      <div 
        className="relative w-full"
        style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }}
      >
        <video
          ref={videoRef}
          className="object-cover absolute inset-0 w-full h-full rounded-lg"
          poster={video.thumbnail}
          playsInline
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
        />
        {video.duration && (
          <div className="absolute right-2 bottom-2 px-2 py-1 text-sm text-white bg-black bg-opacity-50 rounded">
            {Math.floor(video.duration / 60)}:{Math.floor(video.duration % 60).toString().padStart(2, '0')}
          </div>
        )}
        {isHovering && video.duration && (
          <div className="absolute right-0 bottom-0 left-0 h-1 bg-gray-200 bg-opacity-10">
            <div
              className="absolute top-0 bottom-0 left-0 bg-white transition-all duration-75"
              style={{
                width: progress
              }}
            />
          </div>
        )}
      </div>
      <div
        className={`absolute inset-0 bg-black will-change-opacity transition-opacity duration-300 ease-in-out rounded-lg ${
          isSelected ? 'bg-opacity-10' : 'bg-opacity-0 group-hover:bg-opacity-10'
        }`}
      />
      {isSelected && (
        <div className="absolute top-4 left-4 p-1 bg-blue-500 rounded-full transition-transform duration-200 ease-in-out transform scale-100">
          <Check className="text-white" size={20} />
        </div>
      )}
    </div>
  );
});

export default VideoItem; 