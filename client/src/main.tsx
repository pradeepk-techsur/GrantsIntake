// GrantFlow Design System v1.0 — migrated 2026-08-03
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './grantflow.css';
import App from './App.tsx';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
