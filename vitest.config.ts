import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    alias: {
      '@react-ad-engine/core': path.resolve(import.meta.dirname, './packages/core/src/index.ts'),
      '@react-ad-engine/core/': path.resolve(import.meta.dirname, './packages/core/src/'),
      '@react-ad-engine/react': path.resolve(import.meta.dirname, './packages/react/src/index.ts'),
      '@react-ad-engine/react/': path.resolve(import.meta.dirname, './packages/react/src/'),
      '@react-ad-engine/web': path.resolve(import.meta.dirname, './packages/web/src/index.ts'),
      '@react-ad-engine/web/': path.resolve(import.meta.dirname, './packages/web/src/'),
      '@react-ad-engine/react-native': path.resolve(import.meta.dirname, './packages/react-native/src/index.ts'),
      '@react-ad-engine/react-native/': path.resolve(import.meta.dirname, './packages/react-native/src/'),
      '@react-ad-engine/integrations': path.resolve(import.meta.dirname, './packages/integrations/src/index.ts'),
      '@react-ad-engine/integrations/': path.resolve(import.meta.dirname, './packages/integrations/src/'),
    },
  },
});
