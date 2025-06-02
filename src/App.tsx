import React, { useMemo } from 'react';
import { Category } from './types/index.ts';
import { Trash2, FolderPlus, Tags, Tag, FolderX } from 'lucide-react';
import './App.css';
import { useLocale } from './contexts/LanguageContext';
import { scan } from "react-scan";
import { useAppContext } from './contexts/AppContext';
import { useAppEventHandlers } from './hooks/useAppEventHandlers';
import { useAppDialogs } from './hooks/useAppDialogs';
import { useAppUI } from './hooks/useAppUI';
import { AppUI } from './components/AppUI';
import { AppProvider } from './contexts/AppContext';

// Define BulkAction interface
interface BulkAction {
  id: string;
  name: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  categories?: Category[];
  onSelectCategories?: (categories: string[]) => void;
}

const isDev = import.meta.env.DEV;
if (isDev) {
  scan({ enabled: true, log: true, showToolbar: true });
}

const AppContent = () => {
  // Call hooks at the top level of the component
  const state = useAppContext();
  const { t } = useLocale();
  const eventHandlers = useAppEventHandlers(state);
  const dialogs = useAppDialogs(state, eventHandlers);
  const ui = useAppUI(state);
  
  const {
    mediaList,
    selectedCategory,
    categories,
    selectedImages,
    importState,
    filteredAndSortedImages
  } = state;

  const {
    handleSelectSubfolder,
    handleImportFolder,
    handleRenameCategory,
    handleReorderCategories,
    handleAddCategory,
    handleAddToCategory,
    setCategories
  } = eventHandlers.categoryOperations;

  const {
    handleFavorite,
    handleSort,
    handleSearch,
    handleImportImages,
    updateTagsByMediaId,
    handleAddImages,
    handleOpenInEditor,
    handleRateChange,
    executeDelete,
    handleBatchTagImages
  } = eventHandlers.imageOperations;

  // Extract the current selected category from the categories array
  const currentSelectedCategory = useMemo(() => {
    return categories.find(cat => cat.id === selectedCategory);
  }, [categories, selectedCategory]);
  
  // Create the bulk actions menu options
  const bulkActions = useMemo(() => {
    const {
      handleBulkDelete,
      handleBulkDeleteFromCategory,
      handleAddTags,
      openTagPopup
    } = eventHandlers;

    const actions: BulkAction[] = [
      {
        id: 'delete',
        name: 'delete',
        icon: <Trash2 size={20} />,
        label: t('delete'),
        onClick: handleBulkDelete
      },
      {
        id: 'addToCategory',
        name: 'addToCategory',
        icon: <FolderPlus size={20} />,
        label: t('addToCategory'),
        onClick: () => { },
        categories: categories,
        onSelectCategories: handleAddToCategory
      },
      {
        id: 'addTags',
        name: 'addTags',
        icon: <Tags size={20} />,
        label: t('addTags'),
        onClick: handleAddTags
      },
      {
        id: 'batchTag',
        name: 'batchTag',
        icon: <Tag size={20} />,
        label: t('batchTag'),
        onClick: openTagPopup
      }
    ];
    
    if (currentSelectedCategory) {
      actions.splice(1, 0, {
        id: 'deleteFromCategory',
        name: 'deleteFromCategory',
        icon: <FolderX size={20} />,
        label: t('deleteFromCategory'),
        onClick: handleBulkDeleteFromCategory
      });
    }
    return actions;
  }, [
    eventHandlers,
    categories,
    currentSelectedCategory,
    t
  ]);

  // Create the category operations object to pass to components
  const categoryOperations = {
    categories,
    setCategories,
    handleAddCategory,
    handleRenameCategory,
    handleReorderCategories,
    handleImportFolder,
    handleSelectSubfolder,
    handleAddToCategory: handleAddToCategory
  };

  // Create the image operations object to pass to components
  const imageOperations = {
    images: mediaList,
    setImages: state.setMediaList,
    importState,
    handleSort,
    handleSearch,
    bulkActions: selectedImages.size > 0 ? bulkActions : [],
    handleImportImages,
    filteredAndSortedImages,
    handleFavorite,
    updateTagsByMediaId,
    handleAddImages,
    handleOpenInEditor,
    handleRateChange,
    executeDelete,
    handleBatchTagImages
  };

  return (
    <AppUI
      state={state}
      mediaList={mediaList}
      categories={categories}
      currentSelectedCategory={currentSelectedCategory}
      eventHandlers={eventHandlers}
      dialogs={dialogs}
      ui={ui}
      categoryOperations={categoryOperations}
      imageOperations={imageOperations}
    />
  );
}

const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;