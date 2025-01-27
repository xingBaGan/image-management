import React, { memo, useCallback } from 'react';
import Masonry from 'react-masonry-css';
import { LocalImageData } from '../types';
import { ImageGridBaseProps, handleContextMenu, breakpointColumns } from './ImageGridBase';
import ImageItem from './ImageItem';
import VideoItem from './VideoItem';
import { useInView } from 'react-intersection-observer';

// 使用 memo 优化 MediaItem 组件的重渲染
const MediaItem = memo(({ media, props }: { media: LocalImageData; props: any }) => {
  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: true,
  });

  return (
    <div ref={ref}>
      {inView && (
        media.type === 'video' ? (
          <VideoItem video={media as LocalImageData & { type: 'video'; duration?: number; thumbnail?: string }} {...props} />
        ) : (
          <ImageItem image={media} {...props} />
        )
      )}
    </div>
  );
});

const GridView: React.FC<ImageGridBaseProps> = ({
  images,
  onFavorite,
  viewMode,
  selectedImages,
  onSelectImage,
  setViewingMedia,
}) => {
  const renderMediaItem = useCallback((media: LocalImageData) => {
    const props = {
      isSelected: selectedImages.has(media.id),
      onSelect: (e: React.MouseEvent) => onSelectImage(media.id, e.shiftKey),
      onDoubleClick: (e: React.MouseEvent) => setViewingMedia?.(media),
      onFavorite,
      viewMode,
    };

    return <MediaItem media={media} props={props} />;
  }, [selectedImages, onSelectImage, onFavorite, viewMode]);

  return (
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
  );
};

export default memo(GridView); 