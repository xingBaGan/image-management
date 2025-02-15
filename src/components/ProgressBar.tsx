import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from '../contexts/LanguageContext';

interface ProgressBarProps {
  progress: number;
  type: 'tag' | 'color';
  total: number;
  completed: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, type, total, completed }) => {
  const [shouldShow, setShouldShow] = useState(false);
  const { t } = useLocale();

  useEffect(() => {
    if (total > 0) {
      setShouldShow(true);
    }
  }, [total]);

  if (total === 0 && !shouldShow) return null;

  return (
    <AnimatePresence
      onExitComplete={() => setShouldShow(false)}
    >
      {shouldShow && (
        <motion.div
          initial={{ 
            x: 300,
            opacity: 0,
            scale: 0.3
          }}
          animate={{ 
            x: 0,
            opacity: 1,
            scale: 1
          }}
          exit={{ 
            x: 100,
            opacity: 0,
            scale: 1.5,
            filter: "blur(10px)"
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
            exit: { duration: 0.5 }
          }}
          className="fixed right-4 bottom-4 z-50 p-3 w-64 rounded-lg shadow-lg backdrop-blur-sm bg-white/90 dark:bg-gray-800/90"
        >
          <motion.div 
            className="flex justify-between mb-1"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t(type === 'tag' ? 'tagAnalysis' : 'colorAnalysis')} ({t('processingProgress', { completed, total })})
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {progress}%
            </span>
          </motion.div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
            <motion.div 
              className="bg-blue-600 h-2.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ 
                width: `${progress}%`,
                background: progress === 100 ? 
                  "linear-gradient(90deg, #4ade80, #3b82f6)" : 
                  "linear-gradient(90deg, #60a5fa, #3b82f6)"
              }}
              transition={{ 
                duration: 0.5,
                ease: "easeOut"
              }}
            >
              <motion.div
                className="w-full h-full opacity-50"
                animate={{
                  background: [
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
                    "linear-gradient(90deg, transparent 100%, rgba(255,255,255,0.5) 150%, transparent 200%)",
                  ],
                  x: ["-100%", "100%"],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "linear",
                }}
              />
            </motion.div>
          </div>
          {progress === 100 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 p-1 bg-green-500 rounded-full"
            >
              <svg 
                className="w-4 h-4 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProgressBar; 