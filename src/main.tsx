// Ensure window.fetch has both getter and setter so wrappers/extensions do not throw TypeError
try {
  let _fetch = window.fetch ? window.fetch.bind(window) : undefined;
  Object.defineProperty(window, 'fetch', {
    get() {
      return _fetch;
    },
    set(val) {
      _fetch = val;
    },
    configurable: true,
    enumerable: true,
  });
} catch {
  // Ignored if already defined or restricted
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
