import React, { useState } from 'react';
import { LocalImageData } from '../types/index.ts';
import { useLocale } from '../contexts/LanguageContext';
import BasicInfoTab from './BasicInfoTab';
import MetadataTab from './MetadataTab';

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

    // 检查是否有可用的 metadata
    const hasMetadata = image && image.type === 'image' && image.metadata;

    // 根据是否有 metadata 决定 activeTab 的类型
    const [activeTab, setActiveTab] = useState<'basic' | 'metadata'>(hasMetadata ? 'basic' : 'basic');

    // 如果当前选中的是 metadata 但没有 metadata 可用，则切换到 basic
    React.useEffect(() => {
        if (!hasMetadata && activeTab === 'metadata') {
            setActiveTab('basic');
        }
    }, [hasMetadata, activeTab]);

    if (!image) return (
        <div className="overflow-y-auto p-4 w-60 border-l border-gray-200 backdrop-blur-lg bg-white/30 dark:bg-gray-800/30 video-info-sidebar"
            style={{
                height: 'calc(100vh - 5rem)',
            }}
        >
            {type === 'video' ? (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-600 dark:text-white">{t('videoInfo')}</h3>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-white">
                        {t('totalVideos', { count: totalVideos })}
                    </div>
                </>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-600 dark:text-white">{t('basicInfo')}</h3>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-white">
                        {t('totalImages', { count: totalImages })}
                    </div>
                </>
            )}
        </div>
    );

    return (
        <div className="overflow-y-auto overflow-x-hidden p-2 w-60 border-l border-gray-200 backdrop-blur-lg bg-white/30 dark:bg-gray-800/30 image-info-sidebar"
            style={{
                height: 'calc(100vh - 5rem)',
            }}
        >
            {/* Tab Navigation */}
            <div className={`flex mb-4 border-b border-gray-200 dark:border-gray-700 ${hasMetadata ? '' : 'justify-center'}`}>
                <button
                    className={`${hasMetadata ? 'flex-1' : 'w-full'} py-2 px-4 text-sm font-medium text-center transition-colors ${
                        activeTab === 'basic'
                            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    onClick={() => setActiveTab('basic')}
                >
                    {t('basicInfo')}
                </button>
                {hasMetadata && (
                    <button
                        className={`flex-1 py-2 px-4 text-sm font-medium text-center transition-colors ${
                            activeTab === 'metadata'
                                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                        onClick={() => setActiveTab('metadata')}
                    >
                        Metadata
                    </button>
                )}
            </div>
            {/* Tab Content */}
            {activeTab === 'basic' && (
                <BasicInfoTab
                    image={image}
                    onTagsUpdate={onTagsUpdate}
                    onRateChange={onRateChange}
                    setFilterColors={setFilterColors}
                    setSelectedImages={setSelectedImages}
                />
            )}

            {/* Metadata Tab */}
            {activeTab === 'metadata' && hasMetadata && (
                <MetadataTab image={image} />
            )}
        </div>
    );
};

export default ImageInfoSidebar; 