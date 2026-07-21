import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { VaultManager } from './VaultManager';
import { ToastProvider } from '../shared/ui/ToastProvider';
import { LockGate } from '../shared/ui/LockGate';
import '../shared/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LockGate>
      <ToastProvider>
        <VaultManager />
      </ToastProvider>
    </LockGate>
  </StrictMode>
);
