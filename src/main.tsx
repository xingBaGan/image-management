import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './contexts/i18n'  // 引入 i18n 配置
import { SettingsProvider } from './contexts/SettingsContext'
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import initializePlugins from './plugins/index';

initializePlugins();

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
