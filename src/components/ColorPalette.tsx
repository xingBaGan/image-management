import React, { useState } from 'react';

interface Color {
    color: string;
    percentage?: number;
}

interface ColorPaletteProps {
    colors: (string | Color)[];
    setFilterColors: (colors: string[]) => void;
    setSelectedImages: (images: Set<string>) => void;
}


const ColorPalette: React.FC<ColorPaletteProps> = ({
    colors,
    setFilterColors,
    setSelectedImages,
}) => {
    const [activeColorIndex, setActiveColorIndex] = useState<number | null>(null);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

    const handleContextMenu = (e: React.MouseEvent, index: number) => {
        e.preventDefault();
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setActiveColorIndex(index);
    };

    const handleSetFilterColor = (color: string | Color) => {
        const colorValue = typeof color === 'string' ? color : color.color;
        setFilterColors([colorValue]);
        setActiveColorIndex(null);
        setSelectedImages(new Set());
    };

    const handleClick = (e: React.MouseEvent, index: number) => {
        e.preventDefault();
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setActiveColorIndex(prev => prev === index ? null : index);
    };

    const handleOutsideClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.color-item')) {
            setActiveColorIndex(null);
        }
    };

    return (
        <div className='bg-gray-100 rounded-lg dark:bg-gray-700' onClick={handleOutsideClick}>
            <div className="flex flex-wrap gap-1 justify-center p-1 mt-2">
                {colors?.map((color, index) => (
                    <div
                        key={index}
                        className="relative group color-item"
                        onContextMenu={(e) => handleContextMenu(e, index)}
                        onClick={(e) => handleClick(e, index)}
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
                        {activeColorIndex === index && (
                            <>
                                <div
                                    className="fixed inset-0 z-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveColorIndex(null);
                                    }}
                                />
                                <div
                                    className="absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 min-w-[120px]"
                                    style={{
                                        left: '50%',
                                        top: '100%',
                                        transform: 'translateX(-50%)',
                                        marginTop: '0.5rem'
                                    }}
                                >
                                    <button
                                        className="px-4 py-2 w-full text-xs text-center hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSetFilterColor(color);
                                        }}
                                    >
                                        选择为筛选颜色
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ColorPalette; 