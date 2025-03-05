import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import Masonry from 'react-masonry-css';
import { AppendButtonsProps, LocalImageData, VideoData, isVideoMedia } from '../types';
import { ImageGridBaseProps, handleContextMenu, breakpointColumns } from './ImageGridBase';
import ImageItem from './ImageItem';
import VideoItem from './VideoItem';
import { useInView } from 'react-intersection-observer';
import { useThrottle } from '../hooks/useThrottle';
import { useTranslation } from 'react-i18next';
type MediaItemProps = {
  media: LocalImageData;
  props: any;
  onOpenInEditor: (path: string) => void;
  showInFolder?: (path: string) => void;
  gridItemAppendButtonsProps: AppendButtonsProps[];
  index: number;
  currentViewIndex: number;
  setCurrentViewIndex: (index: number) => void;
}

// 使用 memo 优化 MediaItem 组件的重渲染
const MediaItem = memo(({
  media,
  props,
  onOpenInEditor,
  showInFolder,
  gridItemAppendButtonsProps,
  index,
  currentViewIndex,
  setCurrentViewIndex,
}: MediaItemProps) => {
  const { t } = useTranslation();
  const { ref, inView: inCache } = useInView({
    threshold: 0,
    triggerOnce: true,
  });

  const handleInViewChange = useThrottle((againInView: boolean) => {
    if (inCache && againInView) {
      setCurrentViewIndex(index);
    }
  }, 1200);

  const { ref: triggerRef, inView: triggerAgainInView } = useInView({
    threshold: 0,
    onChange: handleInViewChange
  });

  // 修改销毁逻辑：计算当前项目所在组和当前视图组的距离
  const shouldDestroy = useMemo(() => {
    const currentGroup = Math.floor(currentViewIndex / PAGE_SIZE);
    const itemGroup = Math.floor(index / PAGE_SIZE);
    // 当距离超过2组时销毁
    return Math.abs(currentGroup - itemGroup) > 2;
  }, [currentViewIndex, index]);

  return (
    <div ref={ref}>
      <div ref={triggerRef}></div>
      {(inCache && !shouldDestroy) && (
        <div className={`relative ${media.isBindInFolder ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}>
          {media.isBindInFolder && (
            <div className="absolute -top-1 -right-1 z-10 px-1 text-xs text-white bg-blue-400 rounded-lg">
              {t('bindInFolder')}
            </div>
          )}
          {media.type === 'video' ? (
            <VideoItem video={isVideoMedia(media) ? media : media as VideoData} {...props} inView={triggerAgainInView} />
          ) : (
            <ImageItem
              inView={triggerAgainInView}
              image={media}
              onOpenInEditor={onOpenInEditor}
              showInFolder={showInFolder}
              gridItemAppendButtonsProps={gridItemAppendButtonsProps}
              {...props}
            />
          )}
        </div>
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
    const [currentViewIndex, setCurrentViewIndex] = useState(0);
    const renderMediaItem = useCallback((media: LocalImageData, index: number) => {
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
        index={index}
        currentViewIndex={currentViewIndex}
        setCurrentViewIndex={setCurrentViewIndex}
        props={props}
        onOpenInEditor={onOpenInEditor}
        showInFolder={showInFolder}
        gridItemAppendButtonsProps={gridItemAppendButtonsProps}
      />;
    }, [
      selectedImages,
      onSelectImage,
      onFavorite,
      viewMode,
      currentViewIndex,
      setCurrentViewIndex
    ]);

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
          className="flex -ml-6 w-auto"
          columnClassName={`pl-6 space-y-6 [&>*]:will-change-transform [&>*]:transition-all [&>*]:duration-[300ms] [&>*]:ease-[cubic-bezier(0.4,0,0.2,1)]`}
        >
          {displayImages.map((image, index) => (
            <div
              key={image.id}
              className="image-item transform-gpu transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
              data-image-id={image.id}
              data-image-index={index}
              onContextMenu={handleContextMenu}
            >
              {renderMediaItem(image, index)}
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