import React from 'react';
import { Minus, Square, CopyIcon, X } from 'lucide-react';
import { useLocale } from '../contexts/LanguageContext';
import logo from '../assets/icon.png';

interface TitleBarProps {
  isMaximized: boolean;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
}

const dragStyle = {
  WebkitAppRegion: 'drag'
} as React.CSSProperties;

const noDragStyle = {
  WebkitAppRegion: 'no-drag'
} as React.CSSProperties;

export const TitleBar: React.FC<TitleBarProps> = ({
  isMaximized,
  onMinimize,
  onMaximize, 
  onClose
}) => {
  const { t } = useLocale();
  // Use userAgent for detecting macOS, which is widely supported
  const isMacOS = /Mac|iP(hone|[oa]d)/i.test(navigator.userAgent);

  return (
    <div
      className={`flex ${isMacOS ? 'justify-end' : 'justify-between'} items-center px-4 py-1 h-8 bg-white select-none bg-opacity-45 dark:bg-gray-300 dark:text-gray-700`}
      onDoubleClick={onMaximize}
      style={dragStyle}
    >
      {!isMacOS && (
        <div className="text-gray-700 text-bold">
          <img src={logo} alt="logo" className="w-5 h-5" />
        </div>
      )}
      <div className={`flex items-center space-x-2 ${isMacOS ? 'flex-row-reverse' : ''}`} style={noDragStyle}>
        {isMacOS ? (
          <div className="text-gray-700 text-bold">
            <img src={logo} alt="logo" className="w-5 h-5" />
          </div>
        ) : (
          <>
            <button
              onClick={onMinimize}
              className="p-1 rounded hover:bg-gray-500"
              title={t('minimize')}
            >
              <Minus className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={onMaximize}
              className="p-1 rounded hover:bg-gray-500"
              title={isMaximized ? t('restore') : t('maximize')}
            >
              {isMaximized ? (
                <CopyIcon className="w-4 h-4 text-gray-700" />
              ) : (
                <Square className="w-4 h-4 text-gray-700" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-red-500"
              title={t('close')}
            >
              <X className="w-4 h-4 text-gray-700" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}; 