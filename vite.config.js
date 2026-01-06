import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  server: {
    port: 8083,
  },
  plugins: [
    react(),
    nodePolyfills({
      // Exclure crypto et stream du polyfill par défaut, utiliser nos propres polyfills
      exclude: ['crypto', 'stream'],
      // Inclure les autres polyfills nécessaires
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      // Utiliser crypto-browserify explicitement pour createHash
      crypto: "crypto-browserify",
      stream: "stream-browserify",
      util: "util",
      process: "process/browser",
      buffer: "buffer",
      assert: "assert",
    },
  },
  define: {
    global: "globalThis",
    "process.env": {},
  },
  optimizeDeps: {
    // Inclure les dépendances nécessaires dans les dépendances optimisées
    include: [
      'crypto-browserify',
      'stream-browserify',
      'buffer',
      'readable-stream',
      'process/browser',
    ],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
