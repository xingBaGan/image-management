import React from 'react'
import { ImageResponse } from '../types/image'
import { baseURL } from '../api/images'

interface ImageCardProps {
  image: ImageResponse
  onDoubleClick?: (image: ImageResponse) => void
}

export const ImageCard: React.FC<ImageCardProps> = ({ image, onDoubleClick }) => {
  const [isLoading, setIsLoading] = React.useState(true)
  const [hasError, setHasError] = React.useState(false)

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  const handleDoubleClick = () => {
    onDoubleClick?.(image)
  }

  return (
    <div 
      className="overflow-hidden mb-4 bg-white rounded-lg shadow-md transition-transform hover:-translate-y-1 cursor-pointer"
      onDoubleClick={handleDoubleClick}
    >
      {isLoading && (
        <div 
          className="bg-gray-200 animate-pulse" 
          style={{ 
            width: '100%',
            aspectRatio: image.width / image.height 
          }} 
        />
      )}
      
      <img
        src={`${baseURL}/images/compressed/${image.id}`}
        alt={image.name}
        className={`w-full h-auto object-cover ${isLoading ? 'hidden' : 'block'}`}
        style={{ aspectRatio: image.width / image.height }}
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {hasError && (
        <div className="flex justify-center items-center p-4 bg-gray-100" style={{ aspectRatio: '1' }}>
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      <div className="p-3">
        <p className="text-sm text-gray-700 truncate">{image.name}</p>
      </div>
    </div>
  )
} 