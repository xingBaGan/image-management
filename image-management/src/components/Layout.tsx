import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Image, Upload } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link 
                to="/" 
                className="flex items-center px-2 py-2 text-gray-700 hover:text-gray-900"
              >
                <Image className="h-6 w-6" />
                <span className="ml-2 text-lg font-medium">图片管理</span>
              </Link>
            </div>
            <div className="flex items-center">
              <Link
                to={location.pathname === '/upload' ? '/' : '/upload'}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {location.pathname === '/upload' ? (
                  <>
                    <Image className="h-4 w-4 mr-2" />
                    查看图库
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    上传图片
                  </>
                )}
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

export default Layout 