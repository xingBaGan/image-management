import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ImportStatus } from '../types';

interface DragOverlayProps {
  isDragging: boolean;
  importState: ImportStatus;
}

const DragOverlay: React.FC<DragOverlayProps> = ({ isDragging, importState }) => {
  if (!isDragging && importState === ImportStatus.Imported) return null;
  const isImporting = importState === ImportStatus.Importing || importState === ImportStatus.Tagging;
  return (
    <div className="flex fixed inset-0 z-10 justify-center items-center w-full h-full bg-black bg-opacity-30 backdrop-blur-sm">
      { isImporting ? <Loader2 className="mr-2 text-white animate-spin" size={24} /> : <div className="w-4 h-4 bg-white rounded-full animate-ping"></div>}
      {importState === ImportStatus.Tagging ? 
      <span className="text-lg text-white">tagging...</span> : importState === ImportStatus.Importing ?
      <span className="text-lg text-white">importing...</span> : <span className="text-lg text-white">Release to upload</span>}
    </div>
  );
};

export default DragOverlay; 