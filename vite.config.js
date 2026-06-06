import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Vite 构建配置
export default defineConfig({
  plugins: [vue()],      // Vue 3 SFC 支持
  base: '/earth/',       // GitHub Pages 部署子路径
});
