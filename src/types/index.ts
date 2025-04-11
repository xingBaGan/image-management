// =============== 基础类型定义 ===============
export type ViewMode = 'grid' | 'list';

export type MediaType = 'image' | 'video';

// =============== 界面组件相关类型 ===============
export type AppendButtonsProps = {
  icon: string;
  onClick: (selectedImages: string[]) => void;
  label: string;
  eventId: string;
}

export type BulkAction = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

// =============== 媒体数据相关类型 ===============
export interface MediaInfo {
  id: string;
  name: string;
  path: string;
  size: number;
  type: MediaType;
  dateCreated: string;
  dateModified: string;
  url?: string;
  width?: number;
  height?: number;
  extension: string;
  rating?: number;
  ratio?: string;
}

export interface ColorInfo {
  color: string;
  percentage: number;
}

export interface BaseMediaData extends MediaInfo {
  url?: string;
  favorite?: boolean;
  tags: string[];
  categories?: string[];
  colors: (string | ColorInfo)[];
  isBindInFolder?: boolean | Category;
  isDirty?: boolean;
}

export interface ImageData extends BaseMediaData {
  type: 'image';
}

export interface VideoData extends BaseMediaData {
  type: 'video';
  duration?: number;
  thumbnail?: string;
}

export type LocalImageData = ImageData | VideoData;

// =============== 分类相关类型 ===============
export interface Category {
  id: string;
  name: string;
  images: string[];
  count: number;
  isImportFromFolder?: boolean;
  folderPath?: string;
  children?: Category['id'][]; 
  father?: Category['id'] | null; // 新增父分类属性
  order?: string;
  level?: number;
}

// =============== 设置相关类型 ===============
export interface Settings {
  ComfyUI_URL: string;
  autoTagging: boolean;
  backgroundUrl: string;
  modelName: string;
  autoColor: boolean;
}

// =============== 导入相关类型 ===============
export interface ImportFile extends Omit<File, 'arrayBuffer' | 'text' | 'stream' | 'slice'> {
  dateCreated: string;
  dateModified: string;
  thumbnail?: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
  text: () => Promise<string>;
  stream: () => ReadableStream;
  slice: (start?: number, end?: number, contentType?: string) => Blob;
}

export enum ImportStatus {
  Importing = 'importing',
  Tagging = 'tagging',
  Imported = 'imported',
  Failed = 'failed',
  Loading = 'loading',
}

export enum InstallStatus {
  Installing = 'installing',
  Installed = 'installed',
}

export enum TaskStatus {
  Running = 'running',
  Initialized = 'initialized',
  Canceled = 'canceled',
}

export enum DeleteType {
  DeleteFromCategory = 'deleteFromCategory',
  Delete = 'delete',
  DeleteFromFolder = 'deleteFromFolder',
}
// =============== 插件系统相关类型 ===============
export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
}

export interface PluginAPI {
  on: (channel: string, callback: (...args: any[]) => void) => void;
  removeListener: (channel: string, callback: (...args: any[]) => void) => void;
  getPlugins: () => Promise<Plugin[]>;
  initializePlugin: (pluginId: string) => Promise<void>;
  setupPlugin: (plugin: Plugin) => void;
}

// =============== 筛选和排序相关类型 ===============
export enum FilterType {
  Recent = 'recent',
  Favorites = 'favorites',
  All = 'all',
  Photos = 'photos',
  Videos = 'videos',
}

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export enum SortType {
  Name = 'name',
  Date = 'date',
  Size = 'size',
}

export interface FilterOptions {
  colors: string[];
  ratio: string[];
  rating: number | null;
  formats: string[];
  precision: number;
}

export interface Filter {
  id: string;
  type: 'colors' | 'ratio' | 'rating' | 'formats';
  label: string;
  options?: string[];
}

export interface FileMetadata {
  size: number;
  dateCreated: Date;
  dateModified: Date;
}

export interface OpenImageJsonResult {
  success: boolean;
  error?: string;
}

export interface DownloadUrlImageResult {
  success: boolean;
  localPath?: string;
  fileName?: string;
  size?: number;
  type?: string;
  error?: string;
}

export interface ReadImagesFromFolderResult {
  category: Category;
  images: LocalImageData[];
}

export enum FolderContentChangeType {
  Add = 'add',
  Remove = 'remove',
}

export interface ipcCategoryAPI {
  // Category Service Methods
  addCategory: (newCategory: Category, images: LocalImageData[], categories: Category[]) => Promise<Category[]>;
  renameCategory: (categoryId: string, newName: string, categories: Category[]) => Promise<Category[]>;
  deleteCategory: (categoryId: string, images: LocalImageData[], categories: Category[]) => Promise<{
    updatedCategories: Category[],
    updatedImages: LocalImageData[]
  }>;
  addToCategory: (
    selectedImages: Set<string>,
    selectedCategories: string[],
    images: LocalImageData[],
    categories: Category[]
  ) => Promise<{
    updatedImages: LocalImageData[];
    updatedCategories: Category[];
  }>;
  importFolderFromPath: (
    folderPath: string,
    images: LocalImageData[],
    categories: Category[]
  ) => Promise<{
    newImages: LocalImageData[];
    updatedCategories: Category[];
    categoryId: string;
  }>;
}

export interface IPCImageService {
  toggleFavorite(id: string, images: LocalImageData[], categories: Category[]): Promise<LocalImageData[]>;
  addImages(
    newImages: LocalImageData[],
    currentImages: LocalImageData[],
    categories: Category[],
    currentSelectedCategory?: Category
  ): Promise<LocalImageData[]>;
  bulkDeleteSoft(
    selectedImages: Set<string>,
    images: LocalImageData[],
    categories: Category[]
  ): Promise<{
    updatedImages: LocalImageData[];
    updatedCategories?: Category[];
  }>;
  bulkDeleteHard(
    selectedImages: Set<string>,
    images: LocalImageData[],
    categories: Category[]
  ): Promise<{
    updatedImages: LocalImageData[];
    updatedCategories?: Category[];
  }>;
  bulkDeleteFromCategory(
    selectedImages: Set<string>,
    categories: Category[],
    currentSelectedCategory?: Category
  ): Promise<{
    updatedImages: LocalImageData[];
    updatedCategories: Category[];
  }>;
  updateTags(
    mediaId: string,
    newTags: string[],
    images: LocalImageData[],
    categories: Category[]
  ): Promise<LocalImageData[]>;
  updateRating(
    mediaId: string,
    rate: number,
    images: LocalImageData[],
    categories: Category[]
  ): Promise<{
    updatedImages: LocalImageData[];
    updatedImage: LocalImageData | null;
  }>;
  loadImagesFromJson(): Promise<any>;
  filterAndSortImages(
    mediaList: LocalImageData[],
    options: {
      filter: FilterType;
      selectedCategory: FilterType | string;
      categories: Category[];
      searchTags: string[];
      filterColors: string[];
      multiFilter: FilterOptions;
      sortBy: SortType;
      sortDirection: SortDirection;
    }
  ): LocalImageData[];
  getImageById(imageId: string): Promise<LocalImageData>;
}

// =============== Electron API 类型 ===============
export interface ElectronAPI {
  minimize: () => void
  maximize: () => void
  close: () => void
  onMaximize: (callback: () => void) => void
  onUnmaximize: (callback: () => void) => void
  removeMaximize: (callback: () => void) => void
  removeUnmaximize: (callback: () => void) => void
  readDirectory: (path: string) => Promise<string[]>;
  readFileMetadata: (path: string) => Promise<FileMetadata>;
  showOpenDialog: () => Promise<any[]>;
  saveImagesToJson: (images: LocalImageData[], categories: Category[]) => Promise<void>;
  loadImagesFromJson: () => Promise<{ images: LocalImageData[]; categories: Category[] }>;
  openImageJson: () => Promise<OpenImageJsonResult>;
  saveCategories: (categories: Category[]) => Promise<void>;
  saveImageToLocal: (buffer: Uint8Array, fileName: string, ext: string) => Promise<string>;
  loadSettings: () => Promise<Settings>;
  saveSettings: (settings: Settings) => Promise<boolean>;
  isRemoteComfyUI: () => Promise<boolean>;
  readFile: (filePath: string) => Promise<Buffer>;
  tagImage: (imagePath: string, modelName: string) => Promise<string[]>;
  processDirectoryFiles: (dirPath: string| string[],currentCategory?: null | Category) => Promise<[LocalImageData[], Category]>;
  openInEditor: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  downloadUrlImage: (url: string) => Promise<DownloadUrlImageResult>;
  showInFolder: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  getMainColor: (imagePath: string) => Promise<string[]>;
  onRemoteImagesDownloaded: (callback: (result: { success: boolean; error?: string }) => void) => void;
  removeRemoteImagesDownloadedListener: (callback: (result: { success: boolean; error?: string }) => void) => void;
  onQueueUpdate: (callback: (status: { tagQueue: number, colorQueue: number }) => void) => void;
  resetQueueProgress: (type: 'tag' | 'color') => Promise<boolean>;
  removeQueueUpdateListener: (callback: (status: { tagQueue: number, colorQueue: number }) => void) => void;
  openFolderDialog: () => Promise<string | null>;
  readImagesFromFolder: (folderPath: string) => Promise<ReadImagesFromFolderResult>;
  updateFolderWatchers: (folders: string[]) => Promise<boolean>;
  onFolderContentChanged: (callback: (data: {  type: FolderContentChangeType, newImages: LocalImageData[], category: Category }) => void) => void;
  removeFolderContentChangedListener: (callback: (data: {  type: FolderContentChangeType, newImages: LocalImageData[], category: Category }) => void) => void;
  copyFileToCategoryFolder: (filePath: string, currentCategory: Category) => Promise<boolean>;
  deleteFile: (filePath: string) => Promise<boolean>;
  categoryAPI: ipcCategoryAPI;
  imageAPI: IPCImageService;
  cancelTagging: () => Promise<boolean>;
  cancelColor: () => Promise<boolean>;
  isReadFromDB: () => Promise<boolean>;
  checkEnvironment: () => Promise<{
    needsInstall: boolean;
  }>;
  installEnvironment: () => Promise<boolean>;
}

// =============== 类型守卫函数 ===============
export function isVideoMedia(media: LocalImageData): media is VideoData {
  return media.type === 'video';
}

export function isImageMedia(media: LocalImageData): media is ImageData {
  return media.type === 'image';
}