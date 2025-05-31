import React from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import Masonry from 'react-masonry-css'
import { useInView } from 'react-intersection-observer'
import { imageApi } from '../api/images'
import { ImageCard } from './ImageCard'
import { ScrollToTop } from './ScrollToTop'
import { LoadingSpinner } from './LoadingSpinner'
import { ImageListResponse } from '../types/image'

const breakpointColumns = {
  default: 4,
  1280: 3,
  1024: 3,
  768: 2,
  640: 1
}

export const ImageGrid = () => {
  const { ref, inView } = useInView()

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
      <Masonry
        breakpointCols={breakpointColumns}
        className="flex -ml-4 w-auto"
        columnClassName="pl-4 bg-clip-padding"
      >
        {data?.pages.map((page) =>
          page.images.map((image) => (
            <ImageCard key={image.id} image={image} />
          ))
        )}
      </Masonry>
      
      <div ref={ref} className="h-10" />
      <ScrollToTop />
    </>
  )
} 
