import { defineConfig } from 'vite';

// base: './' 让构建产物用相对路径，GitHub Pages 子路径部署也能直接跑
export default defineConfig({
  base: './',
  server: {
    port: 5173,
    open: false,
  },
});
