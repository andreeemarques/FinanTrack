import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    globalSetup: ['./test/setup-global.ts'],
    setupFiles: ['./test/setup-env.ts'],
    fileParallelism: false, // os ficheiros correm um de cada vez sobre a mesma base de dados
    testTimeout: 30_000,
    hookTimeout: 30_000,
    isolate: false,
  },
});