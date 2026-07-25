import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@uswds/uswds/dist/css/uswds.min.css';
import App from './App.tsx';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
