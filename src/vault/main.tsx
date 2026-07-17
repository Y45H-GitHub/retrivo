import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { VaultManager } from './VaultManager';
import { ToastProvider } from '../shared/ui/ToastProvider';
import '../shared/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <VaultManager />
    </ToastProvider>
  </StrictMode>
);
