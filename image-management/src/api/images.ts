import axios from 'axios'
import { ImageListResponse } from '../types/image'

const port = 8564
export const baseURL = `http://localhost:${port}/api`

const api = axios.create({
  baseURL
})

export const imageApi = {
  getImages: async (page: number, pageSize: number): Promise<ImageListResponse> => {
    const { data } = await api.get(`/images?page=${page}&pageSize=${pageSize}`)
    return data
  },

  uploadImage: async (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData()
    formData.append('image', file)

    const { data } = await api.post('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress?.(progress)
        }
      }
    })
    return data
  }
}