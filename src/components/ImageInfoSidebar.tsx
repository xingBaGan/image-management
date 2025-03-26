import React, { useState } from 'react';
import { LocalImageData } from '../types/index.ts';
import { formatFileSize, formatDate } from '../utils';
import MediaTags from './MediaTags';
import Rating from './Rating';
import ColorPalette from './ColorPalette';
import { useLocale } from '../contexts/LanguageContext';

interface ImageInfoSidebarProps {
    image: LocalImageData | null;
    onTagsUpdate: (mediaId: string, newTags: string[]) => void;
    onRateChange: (mediaId: string, rate: number) => void;
    totalImages: number;
    totalVideos: number;
    type: 'image' | 'video';
    setFilterColors: (colors: string[]) => void;
    setSelectedImages: (images: Set<string>) => void;
}

const ImageInfoSidebar: React.FC<ImageInfoSidebarProps> = ({
    image,
    onTagsUpdate,
    onRateChange,
    totalImages,
    totalVideos,
    type,
    setFilterColors,
    setSelectedImages,
}) => {
    const { t } = useLocale();

    if (!image) return (
        <div className="overflow-y-auto p-4 w-60 border-l border-gray-200 backdrop-blur-md bg-white/30 dark:bg-gray-800/30 dark:border-gray-700"
            style={{
                height: 'calc(100vh - 6rem)',
            }}
        >
            {type === 'video' ? (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold dark:text-white">{t('videoInfo')}</h3>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-white">
                        {t('totalVideos', { count: totalVideos })}
                    </div>
                </>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold dark:text-white">{t('basicInfo')}</h3>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-white">
                        {t('totalImages', { count: totalImages })}
                    </div>
                </>
            )}
        </div>
    );

    return (
        <div className="overflow-y-auto overflow-x-hidden p-2 w-60 border-l border-gray-200 backdrop-blur-md bg-white/30 dark:bg-gray-800/30 dark:border-gray-700"
            style={{
                height: 'calc(100vh - 6rem)',
            }}
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold dark:text-white">{t('basicInfo')}</h3>
            </div>
            <div className="space-y-4">
                <div className="relative">
                    <img
                        src={image.type === 'video' ? image.thumbnail : image.path}
                        alt={image.name}
                        className="object-cover w-full rounded-lg h-30"
                    />
                    <div className="inline-block absolute top-1 right-2 text-sm text-gray-700 backdrop-blur-md bg-white/30 dark:text-white">{image.extension}</div>
                </div>

                <div className="space-y-2">
                    {image.colors && image.colors.length > 0 && (
                        <ColorPalette
                            colors={image.colors}
                            setFilterColors={setFilterColors}
                            setSelectedImages={setSelectedImages}
                        />
                    )}
                    <div>
                        <label className="text-sm text-gray-500 dark:text-rose-400">{t('fileName')}</label>
                        {image.name && image.name.length > 10 ? (
                            <div className="relative group">
                                <p className="text-gray-900 truncate dark:text-white max-w-44">{image.name}</p>
                                <div className="hidden absolute z-10 px-2 py-1 h-auto text-xs text-white break-words bg-gray-800 rounded group-hover:inline-block max-w-48">
                                    {image.name}
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-900 dark:text-white">{image.name}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-sm text-gray-500 dark:text-rose-400">{t('dimensions')}</label>
                        <p className="text-gray-900 dark:text-white">{image.width} x {image.height}</p>
                    </div>

                    <div>
                        <label className="text-sm text-gray-500 dark:text-rose-400">{t('fileSize')}</label>
                        <p className="text-gray-900 dark:text-white">{image.size ? formatFileSize(image.size) : ''}</p>
                    </div>

                    <div>
                        <label className="text-sm text-gray-500 dark:text-rose-400">{t('dateCreated')}</label>
                        <p className="text-gray-900 dark:text-white">{image.dateCreated ? formatDate(image.dateCreated) : ''}</p>
                    </div>

                    <div>
                        <label className="text-sm text-gray-500 dark:text-rose-400">{t('dateModified')}</label>
                        <p className="text-gray-900 dark:text-white">{image.dateModified ? formatDate(image.dateModified) : ''}</p>
                    </div>

                    <div>
                        <label className="text-sm text-gray-500 dark:text-rose-400">{t('rating')}</label>
                        <Rating
                            value={image.rating || 0}
                            onChange={(value) => onRateChange(image.id, value)}
                        />
                    </div>
                    <div>
                        <span className="p-1 mb-2 text-sm text-gray-500 dark:text-rose-400">{t('tags')}</span>
                        <span className="text-xs text-gray-500 dark:text-rose-400">
                            {t('tagsHint')}
                        </span>
                        <MediaTags
                            tags={image.tags || []}
                            mediaId={image.id}
                            onTagsUpdate={onTagsUpdate}
                            showCopyButton={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageInfoSidebar; 