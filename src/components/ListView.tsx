import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { FileText, Calendar, Heart } from 'lucide-react';
import { FixedSizeList as List, areEqual } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { LocalImageData, VideoData, isVideoMedia } from '../types';
import { ImageGridBaseProps, handleContextMenu } from './ImageGridBase';
import ImageItem from './ImageItem';
import VideoItem from './VideoItem';
import { useLocale } from '../contexts/LanguageContext';

const ITEM_HEIGHT = 80; // 每行的高度
const OVERSCAN_COUNT = 5; // 预渲染的行数

// 使用 memo 优化 Row 组件的重渲染
const Row = memo(({ data, index, style }: { 
    data: {
        images: LocalImageData[];
        selectedImages: Set<string>;
        onSelectImage: (id: string, isShiftKey: boolean) => void;
        onFavorite: (id: string) => void;
        setViewingMedia?: (media: LocalImageData | null) => void;
        viewMode: string;
        renderMediaItem: (media: LocalImageData) => React.ReactNode;
        handleRowClick: (e: React.MouseEvent, imageId: string) => void;
        handleRowDoubleClick: (e: React.MouseEvent, image: LocalImageData) => void;
    };
    index: number;
    style: React.CSSProperties;
}) => {
    const { t } = useLocale();
    const {
        images,
        selectedImages,
        handleRowClick,
        handleRowDoubleClick,
        onFavorite,
        renderMediaItem
    } = data;
    const image = images[index];

    // 如果图片数据还未加载，显示占位符
    if (!image) {
        return (
            <div style={style} className="bg-gray-100 animate-pulse dark:bg-gray-700" />
        );
    }

    return (
        <div
            style={{
                ...style,
                backgroundColor: selectedImages.has(image.id) 
                    ? 'var(--selected-bg-color, rgba(59, 130, 246, 0.1))' 
                    : undefined
            }}
            className={`grid gap-4 items-center p-4 transition-colors cursor-pointer grid-cols-[auto_1fr_auto_auto_auto] hover:bg-gray-50 dark:hover:bg-gray-700 image-item
                ${image.isBindInFolder ? 'border-l-4 border-blue-400' : ''}`}
            data-image-id={image.id}
            onContextMenu={handleContextMenu}
            onClick={(e) => handleRowClick(e, image.id)}
            onDoubleClick={(e) => handleRowDoubleClick(e, image)}
        >
            <div className="media-item">
                {renderMediaItem(image)}
            </div>
            <div className="flex items-center">
                <FileText size={16} className="mr-2 text-gray-400" />
                <span className="text-gray-700 dark:text-white">
                    {image.name}
                    {image.isBindInFolder && (
                        <span className="ml-2 text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded">
                            已绑定
                        </span>
                    )}
                </span>
            </div>
            <div className="flex gap-4 justify-between items-center w-50">
                <div className="text-gray-500 dark:text-white min-w-15">
                    {t('listFileSize', { size: (image.size / 1024 / 1024).toFixed(2) })}
                </div>
                <div className="flex items-center text-gray-500 dark:text-white">
                    <Calendar size={16} className="mr-2" />
                    {new Date(image.dateModified).toLocaleDateString()}
                </div>
                <div 
                    className="favorite-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onFavorite(image.id);
                    }}
                >
                    {image.favorite ? 
                        <Heart size={20} className="text-red-500" /> : 
                        <Heart size={20} className="text-gray-400" />
                    }
                </div>
            </div>
        </div>
    );
}, areEqual);

const ListView: React.FC<ImageGridBaseProps> = ({
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
    const { t } = useLocale();
    const listRef = useRef<List>(null);
    const [isScrolling, setIsScrolling] = useState(false);

    const handleRowClick = useCallback((e: React.MouseEvent, imageId: string) => {
        if (
            (e.target as HTMLElement).closest('.favorite-button') ||
            (e.target as HTMLElement).closest('.media-item')
        ) {
            return;
        }
        onSelectImage(imageId, e.shiftKey);
    }, [onSelectImage]);

    const handleRowDoubleClick = useCallback((e: React.MouseEvent, image: LocalImageData) => {
        if ((e.target as HTMLElement).closest('.favorite-button')) {
            return;
        }
        setViewingMedia?.(image);
    }, [setViewingMedia]);

    const renderMediaItem = useCallback((media: LocalImageData) => {
        const baseProps = {
            isSelected: selectedImages.has(media.id),
            onFavorite,
            viewMode,
        };

        if (media.type === 'video') {
            const videoProps = {
                ...baseProps,
                onSelect: (id: string, selected: boolean) => onSelectImage(id, false),
                onOpenInEditor,
            };
            return <VideoItem video={isVideoMedia(media) ? media : media as VideoData} {...videoProps} />;
        } else {
            const imageProps = {
                ...baseProps,
                onSelect: (e: React.MouseEvent) => onSelectImage(media.id, e.shiftKey),
                onDoubleClick: (e: React.MouseEvent) => setViewingMedia?.(media),
                onOpenInEditor,
                showInFolder,
                gridItemAppendButtonsProps: gridItemAppendButtonsProps,
            };
            return <ImageItem image={media} {...imageProps} />;
        }
    }, [selectedImages, onSelectImage, setViewingMedia, onFavorite, viewMode, onOpenInEditor]);

    const itemData = {
        images,
        selectedImages,
        onSelectImage,
        onFavorite,
        setViewingMedia,
        viewMode,
        renderMediaItem,
        handleRowClick,
        handleRowDoubleClick,
    };

    return (
        <div className="h-full bg-white bg-opacity-60 rounded-lg shadow dark:bg-gray-800 dark:bg-opacity-60">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 p-4 border-b dark:border-gray-700 font-medium text-gray-500 dark:text-rose-400">
                <div className="w-12"></div>
                <div>{t('listName')}</div>
                <div>{t('listSize')}</div>
                <div>{t('listDateModified')}</div>
                <div className="w-20">{t('listActions')}</div>
            </div>
            <div className="h-[calc(100%-60px)]">
                <AutoSizer>
                    {({ height, width }) => (
                        <List
                            ref={listRef}
                            height={height}
                            itemCount={images.length}
                            itemSize={ITEM_HEIGHT}
                            width={width}
                            itemData={itemData}
                            overscanCount={OVERSCAN_COUNT}
                            onScroll={({ scrollOffset }) => {
                                setIsScrolling(true);
                                // 使用 RAF 来优化滚动性能
                                requestAnimationFrame(() => {
                                    setIsScrolling(false);
                                });
                            }}
                            className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
                        >
                            {Row}
                        </List>
                    )}
                </AutoSizer>
            </div>
        </div>
    );
};

export default memo(ListView); 