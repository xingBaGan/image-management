import React from 'react';
import { TitleBar } from './TitleBar';
import { MainContent } from './MainContent';
import Sidebar from './Sidebar';
import { useSettings } from '../contexts/SettingsContext';
import Settings from './Settings';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import MessageBox from './MessageBox';
import ProgressBar from './ProgressBar';
import DeleteImagesConfirmDialog from './DeleteImagesConfirmDialog';
import BatchTagDialog from './BatchTagDialog';
import ConfirmTagDialog from './ConfirmTagDialog';
import InstallConfirmDialog from './InstallConfirmDialog';
import { ToastContainer } from 'react-toastify';
import { Category, LocalImageData } from '../types';

interface ImageOperations {
  images: LocalImageData[];
  setImages: React.Dispatch<React.SetStateAction<LocalImageData[]>>;
  importState: any;
  handleSort: (sortBy: any) => void;
  handleSearch: (tags: string[]) => void;
  bulkActions: any[];
  handleImportImages: () => Promise<void>;
  filteredAndSortedImages: LocalImageData[];
  handleFavorite: (id: string) => Promise<void>;
  updateTagsByMediaId: (mediaId: string, newTags: string[]) => void;
  handleAddImages: (images: LocalImageData[]) => void;
  handleOpenInEditor: (id: string) => void;
  handleRateChange: (id: string, rating: number) => void;
  executeDelete: (selectedImages: Set<string>, categories: Category[]) => Promise<Category[] | undefined>;
  handleBatchTagImages: (imageIds: string[], tagNames: string[]) => Promise<void>;
}

interface CategoryOperations {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  handleAddCategory: (category: Category) => void;
  handleRenameCategory: (id: string, newName: string) => void;
  handleReorderCategories: (newCategories: Category[]) => void;
  handleImportFolder: () => Promise<void>;
  handleSelectSubfolder: (subfolderId: string) => void;
  handleAddToCategory: (newCategories: string[]) => Promise<void>;
}

export const AppUI = ({
  state,
  mediaList,
  categories,
  currentSelectedCategory,
  eventHandlers,
  dialogs,
  categoryOperations,
  imageOperations
}: {
  state: any;
  mediaList: LocalImageData[];
  categories: Category[];
  currentSelectedCategory: Category | undefined;
  eventHandlers: any;
  dialogs: any;
  ui: any;
  categoryOperations: CategoryOperations;
  imageOperations: ImageOperations;
}) => {
  const { settings } = useSettings();
  const {
    isZenMode,
    isSettingsOpen,
    setIsSettingsOpen,
    selectedImages,
    setSelectedImages,
    viewMode,
    setViewMode,
    sortBy,
    sortDirection,
    filter,
    setFilter,
    selectedCategory,
    setSelectedCategory,
    importState,
    setImportState,
    installStatus,
    filterColors,
    setFilterColors,
    multiFilter,
    setMultiFilter,
    searchTags,
    setSearchTags,
    searchButtonRef,
    sortButtonRef,
    filterButtonRef,
    showDeleteConfirm,
    setShowDeleteConfirm,
    queueProgress,
    showInstallConfirm,
    isDragging,
    setIsDragging,
    columnCount,
    setColumnCount
  } = state;

  const {
    isTagPopupOpen,
    isConfirmDialogOpen,
    batchTagNames,
    closeTagPopup,
    openConfirmDialog,
    closeConfirmDialog,
    handleBatchTag,
    handleDeleteConfirm,
    randomInspirationIndex,
    getRandomButtonState,
    handleInstallConfirm,
    handleCancelTagging,
    handleCancelColor,
    setBatchTagNames,
    messageBoxClose
  } = eventHandlers;

  const {
    handleImageSelect
  } = eventHandlers.imageOperations;

  const {
    showBindInFolderConfirm,
    setShowBindInFolderConfirm,
    messageBox,
    gridItemAppendButtonsProps,
  } = dialogs;

  return (
    <div className="flex flex-col h-screen backdrop-blur-md dark:bg-gray-900"
      style={{
        backgroundImage: `url('${settings.backgroundUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (
          selectedImages.size > 0
          && !target.closest('.main-content-grid') 
          && !target.closest('button') 
          && !target.closest('input')
          && !target.closest('label') 
          && !target.closest('select')
          && !target.closest('textarea') 
          && !target.closest('*[role="dialog"]')
          && !target.closest('*[role="button"]')
          && !target.closest('*[role="checkbox"]')
          && !target.closest('.color-item')
        ) {
          setSelectedImages(new Set());
        }
      }}
    >
      <TitleBar
        isMaximized={state.isMaximized}
        onMinimize={() => window.electron?.minimize()}
        onMaximize={() => window.electron?.maximize()}
        onClose={() => window.electron?.close()}
      />

      <div className="flex w-full h-full bg-white bg-opacity-25 backdrop-blur-sm">
        {!isZenMode && (
          <Sidebar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categories={categories}
            filter={filter}
            onFilterChange={setFilter}
            onAddCategory={categoryOperations.handleAddCategory}
            onRenameCategory={categoryOperations.handleRenameCategory}
            onUpdateCategories={categoryOperations.handleReorderCategories}
            setShowDeleteConfirm={setShowDeleteConfirm}
            onImportFolder={categoryOperations.handleImportFolder}
            setImportState={setImportState}
          />
        )}

        <MainContent
          isZenMode={isZenMode}
          installStatus={installStatus}
          viewMode={viewMode}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onViewModeChange={setViewMode}
          onSortChange={imageOperations.handleSort}
          onSearch={imageOperations.handleSearch}
          selectedCount={selectedImages.size}
          bulkActions={imageOperations.bulkActions}
          onToggleSidebar={() => state.setIsZenMode(!isZenMode)}
          onImport={imageOperations.handleImportImages}
          isSidebarOpen={isZenMode}
          setIsSettingsOpen={setIsSettingsOpen}
          isSettingsOpen={isSettingsOpen}
          filterColors={filterColors}
          setFilterColors={setFilterColors}
          searchButtonRef={searchButtonRef}
          sortButtonRef={sortButtonRef}
          filterButtonRef={filterButtonRef}
          selectedImages={selectedImages}
          multiFilter={multiFilter}
          setMultiFilter={setMultiFilter}
          images={imageOperations.filteredAndSortedImages}
          onFavorite={imageOperations.handleFavorite}
          onSelectImage={handleImageSelect}
          updateTagsByMediaId={imageOperations.updateTagsByMediaId}
          addImages={imageOperations.handleAddImages}
          existingImages={mediaList}
          categories={categories}
          setImportState={setImportState}
          importState={importState}
          onOpenInEditor={imageOperations.handleOpenInEditor}
          gridItemAppendButtonsProps={gridItemAppendButtonsProps}
          onRateChange={imageOperations.handleRateChange}
          setSelectedImages={setSelectedImages}
          currentSelectedCategory={currentSelectedCategory || selectedCategory}
          searchTags={searchTags}
          setSearchTags={setSearchTags}
          onSelectSubfolder={categoryOperations.handleSelectSubfolder}
          randomInspirationIndex={randomInspirationIndex}
          randomButtonState={getRandomButtonState()}
          setRandomInspiration={state.setRandomInspiration}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          columnCount={columnCount}
          setColumnCount={setColumnCount}
        />
      </div>

      {/* Dialogs */}
      {showDeleteConfirm && (
        <DeleteConfirmDialog
          onCancel={() => setShowDeleteConfirm(null)}
          onConfirm={() => handleDeleteConfirm(showDeleteConfirm, mediaList)}
          currentSelectedCategory={categories?.find(it => it.id === showDeleteConfirm) || null}
        />
      )}

      {showBindInFolderConfirm && (
        <DeleteImagesConfirmDialog
          onCancel={() => setShowBindInFolderConfirm(null)}
          selectedImages={Array.from(showBindInFolderConfirm.selectedImages)}
          onConfirm={async () => {
            const newCategories = await imageOperations.executeDelete(
              showBindInFolderConfirm.selectedImages,
              showBindInFolderConfirm.categories
            );
            if (newCategories) {
              categoryOperations.setCategories(newCategories);
              setSelectedImages(new Set());
            }
            setShowBindInFolderConfirm(null);
          }}
        />
      )}

      <MessageBox
        isOpen={messageBox.isOpen}
        onClose={messageBoxClose}
        message={messageBox.message}
        type={messageBox.type}
      />

      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        setMessageBox={state.setMessageBox}
        messageBox={messageBox}
      />

      <BatchTagDialog
        isOpen={isTagPopupOpen}
        onClose={() => {
          closeTagPopup();
        }}
        onConfirm={(tags) => {
          setBatchTagNames(tags);
          openConfirmDialog();
        }}
        numImages={selectedImages.size}
      />

      <ConfirmTagDialog
        isOpen={isConfirmDialogOpen}
        onClose={closeConfirmDialog}
        onConfirm={handleBatchTag}
        tagNames={batchTagNames}
        numImages={selectedImages.size}
      />

      {/* Progress Bars */}
      {queueProgress.tag.total > 0 && (
        <ProgressBar
          type="tag"
          progress={queueProgress.tag.percentage}
          total={queueProgress.tag.total}
          completed={queueProgress.tag.completed}
          offset={queueProgress.color.total > 0 ? 80 : 0}
          onCancel={handleCancelTagging}
          setTasksStatus={state.setTasksStatus}
        />
      )}

      {queueProgress.color.total > 0 && (
        <ProgressBar
          type="color"
          progress={queueProgress.color.percentage}
          total={queueProgress.color.total}
          completed={queueProgress.color.completed}
          offset={0}
          onCancel={handleCancelColor}
          setTasksStatus={state.setTasksStatus}
        />
      )}

      {showInstallConfirm && (
        <InstallConfirmDialog
          isOpen={showInstallConfirm.isOpen}
          onCancel={() => state.setShowInstallConfirm(null)}
          onConfirm={handleInstallConfirm}
          checkResult={showInstallConfirm.checkResult}
        />
      )}

      <ToastContainer />
    </div>
  );
}; 