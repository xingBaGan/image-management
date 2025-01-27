import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface TagEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newTag: string) => void;
  initialTag: string;
}

const TagEditDialog: React.FC<TagEditDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialTag,
}) => {
  const [tagValue, setTagValue] = useState(initialTag);

  useEffect(() => {
    setTagValue(initialTag);
  }, [initialTag]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tagValue.trim()) {
      onConfirm(tagValue.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-rose-400 dark:hover:text-gray-200"
          title="关闭"
          aria-label="关闭对话框"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">编辑标签</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={tagValue}
            onChange={(e) => setTagValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="输入标签名称"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              确定
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TagEditDialog; 