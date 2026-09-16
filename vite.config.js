import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: '.',
  publicDir: 'assets',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        guestbook: resolve(__dirname, 'guestbook.html'),
        'memory-book': resolve(__dirname, 'memory-book.html'),
        reader: resolve(__dirname, 'reader.html'),
        certificate: resolve(__dirname, 'certificate.html'),
        'desk-qr': resolve(__dirname, 'desk-qr.html'),
        methodology: resolve(__dirname, 'methodology.html'),
        mobile: resolve(__dirname, 'mobile.html'),
        quiz: resolve(__dirname, 'quiz.html'),
        verify: resolve(__dirname, 'verify.html')
      },
      output: {
        entryFileNames: 'assets/js/[name].[hash].js',
        chunkFileNames: 'assets/js/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'assets/css/[name].[hash][extname]';
          }
          return 'assets/[name].[hash][extname]';
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      },
      format: {
        comments: false
      }
    },
    cssMinify: true,
    sourcemap: false,
    target: 'es2015'
  },
  server: {
    port: 3000,
    open: true
  },
  optimizeDeps: {
    include: []
  }
});
