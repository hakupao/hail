/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // 相对路径资产——不要在 public/ 下放依赖绝对路径引用的文件
  test: { environment: 'node' },
});
