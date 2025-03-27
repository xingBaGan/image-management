import { TFunction } from "i18next";
import { useState } from "react";
import { LocalImageData } from '../types/index.ts';
import { toast } from 'react-toastify';


const useBatchTag = ({
  selectedImages,
  t,
  handleBatchTagImages,
}: {
  selectedImages: LocalImageData[];
  t: TFunction;
  handleBatchTagImages: (imageIds: string[], tagNames: string[]) => Promise<void>;
}) => {
  const [isTagPopupOpen, setIsTagPopupOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [batchTagNames, setBatchTagNames] = useState<string[]>([]);

  const openTagPopup = () => setIsTagPopupOpen(true);
  const closeTagPopup = () => setIsTagPopupOpen(false);

  const openConfirmDialog = () => setIsConfirmDialogOpen(true);
  const closeConfirmDialog = () => setIsConfirmDialogOpen(false);

  const handleBatchTag = async () => {
    closeConfirmDialog();
    const imageIds = selectedImages.map(image => image.id);
    try {
      await handleBatchTagImages(imageIds, batchTagNames);
      toast.success(t('batchTagSuccess', { count: imageIds.length }));
    } catch (error) {
      toast.error(t('batchTagError'));
    }
    closeTagPopup();
    setBatchTagNames([]);
  };

  return {
    isTagPopupOpen,
    isConfirmDialogOpen,
    batchTagNames,
    openTagPopup,
    closeTagPopup,
    openConfirmDialog,
    closeConfirmDialog,
    handleBatchTag,
    setBatchTagNames,
  };
};

export default useBatchTag;

