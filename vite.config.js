import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  publicDir: 'assets',
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    
    // Минификация кода (включена по умолчанию)
    minify: 'terser',
    
    // Tree-shaking для удаления неиспользуемого кода
    treeshake: true,
    
    // Code splitting для разных страниц
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        memoryBook: resolve(__dirname, 'memory-book.html'),
        quiz: resolve(__dirname, 'quiz.html'),
        reader: resolve(__dirname, 'reader.html'),
        methodology: resolve(__dirname, 'methodology.html'),
        verify: resolve(__dirname, 'verify.html'),
        guestbook: resolve(__dirname, 'guestbook.html'),
        deskQr: resolve(__dirname, 'desk-qr.html'),
        certificate: resolve(__dirname, 'certificate.html'),
        mobile: resolve(__dirname, 'mobile.html')
      },
      output: {
        // Разделение чанков по типам
        manualChunks: {
          vendor: ['@supabase/supabase-js'],
          core: ['./js/core.js'], // Общие утилиты в отдельный чанк
          data: ['./js/data.js'],
          app: ['./js/app.js'],
          admin: ['./js/admin.js'],
          guestbook: ['./js/guestbook.js'],
          quiz: ['./js/quiz.js'],
          reader: ['./js/reader.js']
        }
      }
    },
    
    // Генерация sourcemaps для отладки
    sourcemap: true,
    
    // Оптимизация ассетов
    assetsInlineLimit: 4096,
    cssCodeSplit: true
  },
  
  server: {
    port: 3000,
    open: true
  },
  
  optimizeDeps: {
    include: ['@supabase/supabase-js']
  }
})
