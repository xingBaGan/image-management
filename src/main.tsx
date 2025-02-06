import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { SettingsProvider } from './contexts/SettingsContext'
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <SettingsProvider>
      <ThemeProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </ThemeProvider>
    </SettingsProvider>
  </React.StrictMode>,
)
