/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // 相对路径资产——不要在 public/ 下放依赖绝对路径引用的文件
  test: { environment: 'node', include: ['tests/**/*.test.ts'] }, // include：别扫到 .claude/worktrees 下其他工作区的测试
});
