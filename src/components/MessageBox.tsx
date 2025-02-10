import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useLocale } from '../contexts/LanguageContext';

interface MessageBoxProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

const MessageBox: React.FC<MessageBoxProps> = ({
  isOpen,
  onClose,
  message,
  type = 'info',
  duration = 3000,
}) => {
  const { t } = useLocale();

  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`flex items-center p-4 rounded-lg shadow-lg ${getTypeStyles()}`}>
        <p className="mr-4">{message}</p>
        <button
          onClick={onClose}
          className="p-1 transition-opacity hover:opacity-80"
          title={t('close')}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default MessageBox; 