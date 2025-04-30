import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Copy } from 'lucide-react';
import { toast } from 'react-toastify';

interface TunnelUrlPanelProps {
  tunnelUrl: string;
}

const TunnelUrlPanel: React.FC<TunnelUrlPanelProps> = ({ tunnelUrl }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute right-0 top-[-20%] mt-2 w-64 bg-white rounded-lg border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700 translate-x-[180%]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center p-2 w-full text-sm text-gray-700 rounded-t-lg dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <span>Tunnel URL</span>
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
                toast.success('URL copied to clipboard');
              }}
              className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              title="Copy URL"
            >
              <Copy size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TunnelUrlPanel; 