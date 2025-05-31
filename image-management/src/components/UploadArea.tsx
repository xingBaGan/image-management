import React from 'react'
import { Upload } from 'lucide-react'

interface UploadAreaProps {
  onFilesSelected: (files: File[]) => void
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onFilesSelected }) => {
  const [isDragging, setIsDragging] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files) {
      const validFiles = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
      )
      onFilesSelected(validFiles)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const validFiles = Array.from(e.target.files).filter(file => 
        file.type.startsWith('image/')
      )
      onFilesSelected(validFiles)
      e.target.value = '' // Reset input
    }
  }

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-all duration-300
        ${isDragging 
          ? 'bg-blue-50 border-blue-500' 
          : 'border-gray-300 hover:border-blue-500 hover:bg-gray-50'
        }
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        title="选择文件"
        placeholder="选择文件"
      />
      
      <Upload className="mx-auto mb-4 w-12 h-12 text-blue-500" />
      <p className="mb-2 text-lg text-gray-700">
        拖拽文件到这里或者点击选择文件
      </p>
      <p className="text-sm text-gray-500">
        支持 JPG, JPEG, PNG, GIF, WEBP 格式
      </p>
    </div>
  )
} 