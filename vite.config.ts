import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // service worker 자동 업데이트
      manifest: {
        name: 'HCM', // 설치 배너에 표시되는 이름
        short_name: 'HCM', // 아이콘 아래에 표시될 이름
        description: '친구들과 함께 운동 인증하는 서비스',
        start_url: '/',                    // 앱 실행 시 시작 경로
        display: 'standalone',             // 브라우저 UI 제거(앱처럼)
        background_color: '#ffffff',
        theme_color: '#111827',
        icons: [
          {
            src: '/icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/maskable-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icons/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
        ]
      },
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    global: "window",
  },
}));
