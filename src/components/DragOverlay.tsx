import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface DragOverlayProps {
  isDragging: boolean;
  isTagging: boolean;
}

const DragOverlay: React.FC<DragOverlayProps> = ({ isDragging, isTagging }) => {
  if (!isDragging && !isTagging) return null;

  useEffect(() => {
    const mediaGridContainer = document.querySelector('.media-grid-container');
    // 当遮罩显示时禁用滚动
    if (isDragging || isTagging) {
      (mediaGridContainer as HTMLElement).style.overflow = 'hidden';
    } else {
      (mediaGridContainer as HTMLElement).style.overflow = 'auto';
    }

    // 清理函数，组件卸载时恢复滚动
    return () => {
      (mediaGridContainer as HTMLElement).style.overflow = 'auto';
    };
  }, [isDragging, isTagging]);
  return (
    <div className="flex absolute inset-0 z-10 justify-center items-center w-full h-full bg-black bg-opacity-30 backdrop-blur-sm">
      {isTagging ? <Loader2 className="mr-2 text-white animate-spin" size={24} /> : <div className="w-4 h-4 bg-white rounded-full animate-ping"></div>}
      {isTagging ? <span className="text-lg text-white">tagging...</span> : <span className="text-lg text-white">Release to upload</span>}
    </div>
  );
};

export default DragOverlay; 