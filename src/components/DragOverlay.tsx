import React from 'react';
import { Loader2 } from 'lucide-react';
import { ImportStatus, InstallStatus } from '../types/index.ts';
import { useLocale } from '../contexts/LanguageContext';

interface DragOverlayProps {
  isDragging: boolean;
  importState: ImportStatus;
  installStatus: InstallStatus;
}

const DragOverlay: React.FC<DragOverlayProps> = ({ isDragging, importState, installStatus }) => {
  const { t } = useLocale();  
  if (installStatus === InstallStatus.Installing) {
    return (
      <div className="flex fixed inset-0 z-10 justify-center items-center w-full h-full bg-black bg-opacity-10 backdrop-blur-sm">
        <span className="text-lg text-white">{t('installing')}</span>
      </div>
    );
  }

  if (!isDragging && importState === ImportStatus.Imported) return null;
  const isImporting = importState === ImportStatus.Importing || importState === ImportStatus.Tagging;
  const isLoading = importState === ImportStatus.Loading;
  
  if (isLoading) {
    return (
      <div className="flex fixed inset-0 z-10 justify-center items-center w-full h-full bg-black bg-opacity-10 backdrop-blur-sm">
        <Loader2 className="mr-2 text-white animate-spin" size={24} />
        <span className="text-lg text-white">{t('loading')}</span>
      </div>
    );
  }

  return (
    <div className="flex fixed inset-0 z-10 justify-center items-center w-full h-full bg-black bg-opacity-10 backdrop-blur-sm">
      { isImporting ? <Loader2 className="mr-2 text-white animate-spin" size={24} /> : <div className="w-4 h-4 bg-white rounded-full animate-ping"></div>}
      {importState === ImportStatus.Tagging ? 
        <span className="text-lg text-white">{t('tagging')}</span> : 
        importState === ImportStatus.Importing ?
          <span className="text-lg text-white">{t('importing')}</span> : 
          <span className="text-lg text-white">{t('releaseToUpload')}</span>
      }
    </div>
  );
};

export default DragOverlay; 