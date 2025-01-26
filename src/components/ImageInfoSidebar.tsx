import React from 'react';
import { LocalImageData, ImageInfo } from '../types';
import { formatFileSize, formatDate } from '../utils';
import MediaTags from './MediaTags';
import Rating from './Rating';
import VideoItem from './VideoItem';

interface ImageInfoSidebarProps {
    image: LocalImageData | null;
    onTagsUpdate: (mediaId: string, newTags: string[]) => void;
    onRateChange: (mediaId: string, rate: number) => void;
    totalImages: number;
    totalVideos: number;
    type: 'image' | 'video';
}

const ImageInfoSidebar: React.FC<ImageInfoSidebarProps> = ({
    image,
    onTagsUpdate,
    onRateChange,
    totalImages,
    totalVideos,
    type,
}) => {
    if (!image) return (
        <div className="overflow-y-auto p-4 w-60 border-l border-gray-200 backdrop-blur-md bg-white/30 dark:bg-gray-800/30 dark:border-gray-700"
            style={{
                height: 'calc(100vh - 4rem)',
            }}
        >
           { type === 'video' ? (
            <>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold dark:text-white">视频信息</h3>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
                {totalVideos}个视频
            </div>
            </>
           ) : (
            <>
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold dark:text-white">基本信息</h3>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
                {totalImages}张图片
            </div></>
           ) }
        </div>
    );

    return (
        <div className="overflow-y-auto p-4 w-60 border-l border-gray-200 backdrop-blur-md bg-white/30 dark:bg-gray-800/30 dark:border-gray-700"
            style={{
                height: 'calc(100vh - 4rem)',
            }}
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold dark:text-white">基本信息</h3>
            </div>

            <div className="space-y-4">
                <div>
                    <img
                        src={image.type === 'video' ? image.thumbnail : image.path}
                        alt={image.name}
                        className="object-cover w-full rounded-lg h-30"
                    />
                </div>

                <div className="space-y-2">
                    <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">文件名</label>
                        <p className="text-gray-900 dark:text-white">{image.name}</p>
                    </div>

                    <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">尺寸</label>
                        <p className="text-gray-900 dark:text-white">{image.width} x {image.height}</p>
                    </div>

                    <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">文件大小</label>
                        <p className="text-gray-900 dark:text-white">{formatFileSize(image.size)}</p>
                    </div>

                    <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">创建日期</label>
                        <p className="text-gray-900 dark:text-white">{formatDate(image.dateCreated)}</p>
                    </div>

                    <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">修改日期</label>
                        <p className="text-gray-900 dark:text-white">{formatDate(image.dateModified)}</p>
                    </div>

                    <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">评分</label>
                        <Rating
                            value={image.rate || 0}
                            onChange={(value) => onRateChange(image.id, value)}
                        />
                    </div>

                    <div>
                        <span className="p-1 mb-2 text-sm text-gray-500 dark:text-gray-400">标签</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            (提示：按回车添加标签，按退格键删除)
                        </span>
                        <MediaTags
                            tags={image.tags || []}
                            mediaId={image.id}
                            onTagsUpdate={onTagsUpdate}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageInfoSidebar; 