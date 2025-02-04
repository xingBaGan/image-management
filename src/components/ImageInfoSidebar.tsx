import React from 'react';
import { LocalImageData } from '../types';
import { formatFileSize, formatDate } from '../utils';
import MediaTags from './MediaTags';
import Rating from './Rating';

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
            {type === 'video' ? (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold dark:text-white">视频信息</h3>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-white">
                        {totalVideos}个视频
                    </div>
                </>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold dark:text-white">基本信息</h3>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-white">
                        {totalImages}张图片
                    </div></>
            )}
        </div>
    );

    return (
        <div className="overflow-y-auto p-2 w-60 border-l border-gray-200 backdrop-blur-md bg-white/30 dark:bg-gray-800/30 dark:border-gray-700"
            style={{
                height: 'calc(100vh - 4rem)',
            }}
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold dark:text-white">基本信息</h3>
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
                        <div className='bg-gray-100 rounded-lg dark:bg-gray-700'>
                            <div className="flex flex-wrap gap-1 justify-center p-1 mt-2">
                                {image.colors?.map((color, index) => (
                                    <div
                                        key={index}
                                        className="relative group"
                                    >
                                        <div className="flex items-center">
                                            <div
                                                className="w-4 h-4 rounded-lg border-2 border-transparent transition-all duration-200 cursor-pointer hover:border-[#333333] dark:hover:border-rose-400"
                                                style={{ backgroundColor: typeof color === 'string' ? color : color.color }}
                                            />
                                        </div>
                                        <div className="absolute -top-12 left-1/2 z-10 px-2 py-1 text-xs text-white whitespace-nowrap bg-gray-800 rounded opacity-0 transition-opacity duration-200 transform -translate-x-1/2 group-hover:opacity-100">
                                            {typeof color === 'string' ? color : color.color}
                                            {typeof color !== 'string' && (
                                                <div className="text-gray-300">占比: {color.percentage}%</div>
                                            )}
                                            <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-gray-800 transform rotate-45 -translate-x-1/2 translate-y-1/2"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="text-sm text-gray-500 dark:text-rose-400">文件名</label>
                        {image.name.length > 10 ? (
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

                        <label className="text-sm text-gray-500 dark:text-rose-400">尺寸</label>
                        <p className="text-gray-900 dark:text-white">{image.width} x {image.height}</p>
                    </div>

                    <div>
                        <label className="text-sm text-gray-500 dark:text-rose-400">文件大小</label>
                        <p className="text-gray-900 dark:text-white">{formatFileSize(image.size)}</p>
                    </div>

                    <div>
                        <label className="text-sm text-gray-500 dark:text-rose-400">创建日期</label>
                        <p className="text-gray-900 dark:text-white">{formatDate(image.dateCreated)}</p>
                    </div>

                    <div>
                        <label className="text-sm text-gray-500 dark:text-rose-400">修改日期</label>
                        <p className="text-gray-900 dark:text-white">{formatDate(image.dateModified)}</p>
                    </div>

                    <div>
                        <label className="text-sm text-gray-500 dark:text-rose-400">评分</label>
                        <Rating
                            value={image.rate || 0}
                            onChange={(value) => onRateChange(image.id, value)}
                        />
                    </div>
                    <div>
                        <span className="p-1 mb-2 text-sm text-gray-500 dark:text-rose-400">标签</span>
                        <span className="text-xs text-gray-500 dark:text-rose-400">
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