import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import Masonry from 'react-masonry-css';
import { AppendButtonsProps, LocalImageData, VideoData, isVideoMedia } from '../types';
import { ImageGridBaseProps, handleContextMenu, breakpointColumns } from './ImageGridBase';
import ImageItem from './ImageItem';
import VideoItem from './VideoItem';
import { useInView } from 'react-intersection-observer';

type MediaItemProps = { 
  media: LocalImageData; 
  props: any; 
  onOpenInEditor: (path: string) => void; 
  showInFolder?: (path: string) => void;
  gridItemAppendButtonsProps: AppendButtonsProps[];
 }
// 使用 memo 优化 MediaItem 组件的重渲染
const MediaItem = memo(({ media, props, onOpenInEditor, showInFolder, gridItemAppendButtonsProps }: MediaItemProps) => {
  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: true,
  });

  return (
    <div ref={ref}>
      {inView && (
        media.type === 'video' ? (
          <VideoItem video={isVideoMedia(media) ? media : media as VideoData} {...props} inView={inView}/>
        ) : (
          <ImageItem 
            inView={inView}
            image={media} 
            onOpenInEditor={onOpenInEditor} 
            showInFolder={showInFolder} 
            gridItemAppendButtonsProps={gridItemAppendButtonsProps}
            {...props} 
          />
        )
      )}
    </div>
  );
});

const PAGE_SIZE = 30;
const GridView: React.FC<ImageGridBaseProps & {
  hasMore?: boolean;
  onLoadMore?: () => void;
  loading?: boolean;
}> = ({
  images,
  onFavorite,
  viewMode,
  selectedImages,
  onSelectImage,
  setViewingMedia,
  onOpenInEditor,
  showInFolder,
  gridItemAppendButtonsProps,
}) => {
  const [page, setPage] = useState(1);
  const displayImages = useMemo(() => images.slice(0, page * PAGE_SIZE), [images, page]);

  const hasMore = useMemo(() => images.length > displayImages.length, [images, displayImages]);
  const renderMediaItem = useCallback((media: LocalImageData) => {
    const props = {
      isSelected: selectedImages.has(media.id),
      onSelect: (e: React.MouseEvent) => onSelectImage(media.id, e.shiftKey),
      onDoubleClick: (e: React.MouseEvent) => setViewingMedia?.(media),
      onFavorite,
      viewMode,
      showInFolder,
    };

    return <MediaItem 
      media={media}
      props={props}
      onOpenInEditor={onOpenInEditor}
      showInFolder={showInFolder}
      gridItemAppendButtonsProps={gridItemAppendButtonsProps}
    />;
  }, [selectedImages, onSelectImage, onFavorite, viewMode]);

  // 修改 useInView 配置
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '2000px', // 提前 200px 触发加载
  });

  useEffect(() => {
    if (inView && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [inView, hasMore]);

  return (
    <div className="relative">
      <Masonry
        breakpointCols={breakpointColumns}
        className="flex -ml-6 [&>*]:will-change-[transform,opacity] [&>*]:transition-all [&>*]:duration-500 [&>*]:ease-[cubic-bezier(0.4,0,0.2,1)]"
        columnClassName="pl-6 space-y-6 [&>*]:will-change-[transform,opacity] [&>*]:transition-all [&>*]:duration-500 [&>*]:ease-[cubic-bezier(0.4,0,0.2,1)]"
      >
        {displayImages.map((image) => (
          <div
            key={image.id}
            className="image-item"
            data-image-id={image.id}
            onContextMenu={handleContextMenu}
          >
            {renderMediaItem(image)}
          </div>
        ))}
      {hasMore && <div 
        ref={loadMoreRef} 
        className="flex justify-center items-center w-full h-10"
      >
      </div>}
      </Masonry>
    </div>
  );
};

export default memo(GridView); 