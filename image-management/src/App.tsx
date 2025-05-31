import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ImageGrid from './pages/ImageGallery'
import ImageUpload from './pages/ImageUpload'
import Layout from './components/Layout'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<ImageGrid />} />
          <Route path="/upload" element={<ImageUpload />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <Toaster position="top-right" />
    </BrowserRouter>
  )
}

export default App