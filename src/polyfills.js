// Polyfills pour les modules Node.js dans le navigateur
// Ce fichier doit être importé en premier dans main.jsx

import { Buffer } from "buffer";
import process from "process/browser";

// Injecter Buffer et process globalement
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  window.global = window.global || window;
  window.process = process;
}

if (typeof globalThis !== 'undefined') {
  globalThis.Buffer = Buffer;
  globalThis.process = process;
  globalThis.global = globalThis.global || globalThis;
}

// Exporter pour utilisation explicite si nécessaire
export { Buffer, process };

