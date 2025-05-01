import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Copy } from 'lucide-react';
import { toast } from 'react-toastify';
import { useLocale } from '../../contexts/LanguageContext';
import { QRCodeSVG as QRCode } from 'qrcode.react';

interface TunnelUrlPanelProps {
  tunnelUrl: string;
}

const TunnelUrlPanel: React.FC<TunnelUrlPanelProps> = ({ tunnelUrl }) => {
  const { t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const uploadUrl = `${tunnelUrl}/upload`;

  return (
    <div className="absolute right-0 top-[-20%] mt-2 w-64 bg-white rounded-lg border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700 translate-x-[180%]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center p-2 w-full text-sm text-gray-700 rounded-t-lg dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <span>{t('tunnel_url')}</span>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {isOpen && (
        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={tunnelUrl}
              readOnly
              aria-label="Tunnel URL"
              className="flex-1 p-1 text-sm bg-gray-100 rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(tunnelUrl);
                toast.success(t('copy_url_success'));
              }}
              className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              title="Copy URL"
            >
              <Copy size={16} />
            </button>
          </div>
          <div className="flex flex-col items-center mt-4">
            <div className="p-2 bg-white rounded-lg">
              <QRCode 
                value={uploadUrl}
                size={128}
                level="H"
                includeMargin={true}
                className="rounded-lg"
              />
            </div>
            <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
              {t('scan_to_upload')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TunnelUrlPanel; 