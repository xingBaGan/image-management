import React, { memo, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import Masonry from 'react-masonry-css';
import { AppendButtonsProps, LocalImageData, VideoData, isVideoMedia } from '../types/index.ts';
import { ImageGridBaseProps, handleContextMenu } from './ImageGridBase';
import ImageItem from './ImageItem';
import VideoItem from './VideoItem';
import { useInView } from 'react-intersection-observer';
import { useThrottle } from '../hooks/useThrottle';
import { useTranslation } from 'react-i18next';
import { CopySlash } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
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
const MIN_CHANGE_INTERVAL = 2000; // 3秒
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
  
  // Add timestamp tracking refs
  const lastDestroyChangeRef = useRef<number>(Date.now());
  const lastShouldDestroyRef = useRef<boolean>(false);

  const handleInViewChange = useThrottle((againInView: boolean) => {
    if (inCache && againInView) {
      setCurrentViewIndex(index);
    }
  }, 1200);

  const { ref: triggerRef, inView: triggerAgainInView } = useInView({
    threshold: 0,
    onChange: handleInViewChange
  });

  // 修改销毁逻辑：计算当前项目所在组和当前视图组的距离，并添加时间因素
  const shouldDestroy = useMemo(() => {
    const currentGroup = Math.floor(currentViewIndex / PAGE_SIZE);
    const itemGroup = Math.floor(index / PAGE_SIZE);
    const groupDistance = Math.abs(currentGroup - itemGroup);
    
    // 计算基于组距离的销毁状态
    const newShouldDestroy = groupDistance > 2;
    
    // 获取当前时间戳
    const now = Date.now();
    
    // 如果状态变化了，并且距离上次变化的时间小于3秒，则保持上一个状态
    if (newShouldDestroy !== lastShouldDestroyRef.current) {
      // 至少需要3秒才能改变销毁状态，防止快速切换
      const timeSinceLastChange = now - lastDestroyChangeRef.current;
      
      
      if (timeSinceLastChange < MIN_CHANGE_INTERVAL) {
        return lastShouldDestroyRef.current;
      }
      
      // 更新最后变化时间和状态
      lastDestroyChangeRef.current = now;
      lastShouldDestroyRef.current = newShouldDestroy;
    }
    
    return newShouldDestroy;
  }, [currentViewIndex, index]);

  return (
    <div ref={ref} className="waterfall-item">
      <div ref={triggerRef}></div>
      {(inCache && !shouldDestroy) && (
        <div className={`relative ${media.isBindInFolder ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}>
          {media.isBindInFolder && (
            <div className="absolute -top-1 -right-1 z-10 px-1 text-gray-300">
              {/* {t('bindInFolder')} */}
              <CopySlash size={20}/>
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
  columnCount?: number;
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
  columnCount = 4,
}) => {
    const {
      setPreLoadSize
    } = useAppContext();

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
        key={media.id}
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
    const cachedSize = 200;
    const preLoadSize = useMemo(() => displayImages.length + cachedSize, [displayImages]);
    useEffect(() => {
      if (inView && hasMore) {
        setPage(prev => prev + 1);
      }
    }, [inView, hasMore]);
    
    useEffect(() => {
      setPreLoadSize(preLoadSize);
    }, [preLoadSize]);

    // Dynamically create breakpointColumns based on columnCount
    const breakpointColumns = useMemo(() => {
      const largeScreenCols = Math.min(columnCount, 6);
      const mediumScreenCols = Math.max(Math.min(columnCount - 1, 4), 2);
      const smallScreenCols = Math.max(Math.min(columnCount - 2, 3), 1);
      
      return {
        default: largeScreenCols,
        1536: largeScreenCols,
        1280: mediumScreenCols,
        1024: mediumScreenCols,
        768: smallScreenCols,
      };
    }, [columnCount]);
    
    return (
      <div className="relative ml-4">
        <Masonry
          breakpointCols={breakpointColumns}
          className="flex -ml-6 w-auto"
          columnClassName={`${columnCount >= 5 ? 'pl-1' : 'pl-2'} ${columnCount >= 5 ? 'space-y-1' : 'space-y-2'} [&>*]:will-change-transform [&>*]:transition-all [&>*]:duration-[300ms] [&>*]:ease-[cubic-bezier(0.4,0,0.2,1)]`}
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