export interface ImageFile {
  id: string
  name: string
  size: number
  type: string
  url?: string
  progress?: number
  file?: File
}

export interface ImageResponse {
  id: string
  name: string
  width: number
  height: number
}

export interface PaginationResponse {
  currentPage: number
  hasMore: boolean
  total: number
}

export interface ImageListResponse {
  images: ImageResponse[]
  pagination: PaginationResponse
}