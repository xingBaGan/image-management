import { LocalImageData, Category } from '../../dao/type.cjs';
export interface ImagesData {
    images: LocalImageData[];
    categories: Category[];
}

export interface PaginationResponse {
    currentPage: number;
    pageSize: number;
    totalImages: number;
    totalPages: number;
    hasMore: boolean;
}

export interface ImagesResponse {
    images: Array<LocalImageData>;
    pagination: PaginationResponse;
}

export interface UploadResponse {
    success: boolean;
    message: string;
    image: {
        id: string;
        name: string;
        width: number;
        height: number;
    };
}

export interface TunnelResponse {
    message: string;
    tunnelUrl?: string;
    error?: string;
} 