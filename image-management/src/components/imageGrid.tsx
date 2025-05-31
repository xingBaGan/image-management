import React, { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import Masonry from 'react-masonry-css'
import { useInView } from 'react-intersection-observer'
import { baseURL, imageApi } from '../api/images'
import { ImageCard } from './ImageCard'
import { ScrollToTop } from './ScrollToTop'
import { LoadingSpinner } from './LoadingSpinner'
import { ImageListResponse } from '../types/image'
import MediaViewer from '../../../src/components/MediaViewer'

const breakpointColumns = {
  default: 4,
  1280: 3,
  1024: 3,
  768: 2,
  640: 1
}

export const ImageGrid = () => {
  const { ref, inView } = useInView()
  const [viewingMedia, setViewingMedia] = useState<any>(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
    error
  } = useInfiniteQuery<ImageListResponse>({
    queryKey: ['images'],
    queryFn: ({ pageParam = 1 }) => imageApi.getImages(pageParam as number, 20),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => 
      lastPage.pagination.hasMore ? lastPage.pagination.currentPage + 1 : undefined
  })

  React.useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [inView, fetchNextPage, hasNextPage])

  const handleImageDoubleClick = (image: any) => {
    image.url = `${baseURL}/images/original/${image.id}`
    setViewingMedia(image)
  }

  const handlePrevious = () => {
    if (!data || !viewingMedia) return

    const allImages = data.pages.flatMap(page => page.images)
    const currentIndex = allImages.findIndex(img => img.id === viewingMedia.id)
    if (currentIndex > 0) {
      const previousImage = allImages[currentIndex - 1]
      previousImage.url = `${baseURL}/images/original/${previousImage.id}`
      if (previousImage) {
        setViewingMedia(previousImage)
      }
    }
  }

  const handleNext = () => {
    if (!data || !viewingMedia) return

    const allImages = data.pages.flatMap(page => page.images)
    const currentIndex = allImages.findIndex(img => img.id === viewingMedia.id)
    if (currentIndex < allImages.length - 1) {
      const nextImage = allImages[currentIndex + 1]
      nextImage.url = `${baseURL}/images/original/${nextImage.id}`
      if (nextImage) {
        setViewingMedia(nextImage)
      }
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (isError) {
    return (
      <div className="p-4 text-center text-red-600 bg-red-50 rounded-lg">
        加载失败: {error instanceof Error ? error.message : '未知错误'}
      </div>
    )
  }

  return (
    <>
      {viewingMedia && (
        <MediaViewer
          media={viewingMedia}
          onClose={() => setViewingMedia(null)}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      )}
      <Masonry
        breakpointCols={breakpointColumns}
        className="flex -ml-4 w-auto"
        columnClassName="pl-4 bg-clip-padding"
      >
        {data?.pages.map((page) =>
          page.images.map((image) => (
            <ImageCard 
              key={image.id} 
              image={image} 
              onDoubleClick={() => handleImageDoubleClick(image)}
            />
          ))
        )}
      </Masonry>
      
      <div ref={ref} className="h-10" />
      <ScrollToTop />
    </>
  )
} 
