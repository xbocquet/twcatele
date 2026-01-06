import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Enable polyfills for Node.js modules needed by platform-api
      include: ['events', 'buffer', 'process', 'util'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  resolve: {
    alias: {
      events: 'events',
      buffer: 'buffer',
      process: 'process/browser',
      util: 'util',
    },
    // Ensure CommonJS modules are resolved correctly
    dedupe: ['prop-types'],
  },
  server: {
    port: 8083,
    open: true
  },
  optimizeDeps: {
    include: ['events', 'buffer', 'process', 'util', 'prop-types', '@carbon/icons-react'],
    esbuildOptions: {
      // Handle CommonJS modules properly
      mainFields: ['module', 'main'],
    },
  },
  build: {
    outDir: 'dist',
    commonjsOptions: {
      // Transform CommonJS modules to ES modules
      transformMixedEsModules: true,
      include: [/node_modules/],
    },
  },
})

