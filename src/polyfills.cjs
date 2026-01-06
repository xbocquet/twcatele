// Polyfills CommonJS pour injection dans esbuild
const { Buffer } = require('buffer');
const process = require('process/browser');

// Injecter Buffer et process globalement
if (typeof globalThis !== 'undefined') {
  globalThis.Buffer = Buffer;
  globalThis.process = process;
  globalThis.global = globalThis.global || globalThis;
}

if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  window.global = window.global || window;
  window.process = process;
}

