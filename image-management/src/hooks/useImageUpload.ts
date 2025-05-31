import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { imageApi } from '../api/images'
import { ImageFile } from '../types/image'

export const useImageUpload = () => {
  const [files, setFiles] = useState<ImageFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const addFiles = (newFiles: File[]) => {
    const fileItems = newFiles.map(file => ({
      id: uuidv4(),
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      file
    }))
    setFiles(prev => [...prev, ...fileItems])
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    
    try {
      const uploads = files.map(async (file) => {
        try {
          await imageApi.uploadImage(file.file as File, (progress) => {
            setFiles(prev => 
              prev.map(f => f.id === file.id ? { ...f, progress } : f)
            )
          })
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error)
          throw error
        }
      })

      await Promise.all(uploads)
      setFiles([])
    } finally {
      setIsUploading(false)
    }
  }

  return {
    files,
    isUploading,
    addFiles,
    removeFile,
    uploadFiles
  }
}