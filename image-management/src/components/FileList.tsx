import React from 'react'
import { X, Image as ImageIcon } from 'lucide-react'
import { ImageFile } from '../types/image'

interface FileListProps {
  files: ImageFile[]
  onRemove: (id: string) => void
}

export const FileList: React.FC<FileListProps> = ({ files, onRemove }) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-3">
      {files.map((file) => (
        <div 
          key={file.id}
          className="flex gap-4 items-center p-4 bg-white rounded-lg shadow-sm"
        >
          <div className="flex-shrink-0">
            <ImageIcon className="w-8 h-8 text-blue-500" />
          </div>

          <div className="flex-grow min-w-0">
            <div className="flex justify-between items-start mb-1">
              <p className="text-sm font-medium text-gray-700 truncate">
                {file.name}
              </p>
              <button
                onClick={() => onRemove(file.id)}
                className="ml-2 text-gray-400 transition-colors hover:text-red-500"
                aria-label="删除文件"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mb-2 text-xs text-gray-500">
              {formatFileSize(file.size)}
            </p>

            {typeof file.progress === 'number' && (
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${file.progress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
} 