import React, { createContext, useContext, useState, Dispatch, SetStateAction } from 'react';
import { useAppState } from '../hooks/useAppState';
import { ViewMode, FilterType, SortType, SortDirection, LocalImageData, FilterOptions, ImportStatus, InstallStatus, TaskStatus, Category } from '../types';

type AppStateType = ReturnType<typeof useAppState>;

interface AppContextType extends Omit<AppStateType, 'preLoadSize' | 'setPreLoadSize'> {
  preLoadSize: number;
  setPreLoadSize: Dispatch<SetStateAction<number>>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preLoadSize, setPreLoadSize] = useState<number>(0);
  const appState = useAppState();

  // Remove preLoadSize and setPreLoadSize from appState
  const { ...restAppState } = appState;

  const value = {
    ...restAppState,
    preLoadSize,
    setPreLoadSize,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 