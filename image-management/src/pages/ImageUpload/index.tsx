import React from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { UploadArea } from '../../components/UploadArea'
import { FileList } from '../../components/FileList'
import { useImageUpload } from '../../hooks/useImageUpload'

const ImageUpload = () => {
  const navigate = useNavigate()
  const { files, addFiles, removeFile, uploadFiles, isUploading } = useImageUpload()

  const handleUploadComplete = () => {
    toast.success('所有图片上传成功！')
    setTimeout(() => {
      navigate('/')
    }, 2000)
  }

  const handleUploadError = (error: Error) => {
    toast.error(`上传失败: ${error.message}`)
  }

  const handleSubmit = async () => {
    try {
      await uploadFiles()
      handleUploadComplete()
    } catch (error) {
      handleUploadError(error as Error)
    }
  }

  return (
    <div className="px-4 py-8 mx-auto max-w-3xl">
      <h1 className="mb-8 text-2xl font-semibold text-center text-gray-800">图片上传</h1>
      
      <div className="space-y-6">
        <UploadArea onFilesSelected={addFiles} />
        
        {files.length > 0 && (
          <>
            <FileList 
              files={files} 
              onRemove={removeFile} 
            />
            
            <button
              onClick={handleSubmit}
              disabled={isUploading || files.length === 0}
              className="px-4 py-3 w-full font-medium text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isUploading ? '上传中...' : '上传图片'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default ImageUpload

