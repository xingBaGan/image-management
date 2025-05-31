import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    // 输出到 electron/imageServer 目录
    outDir: path.resolve(__dirname, '../electron/imageServer/dist'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // 确保生成的资源使用相对路径
        assetFileNames: 'assets/[name].[hash].[ext]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      }
    }
  },
  server: {
    proxy: {
      // 开发时代理 API 请求到 Electron 的服务
      '/api': {
        target: 'http://localhost:8564',
        changeOrigin: true
      }
    }
  }
}) 