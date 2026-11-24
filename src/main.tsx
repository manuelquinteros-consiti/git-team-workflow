import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { createDependencies } from './app/dependencies';
import { DependenciesProvider } from './app/providers/DependenciesProvider';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DependenciesProvider dependencies={createDependencies()}>
      <App />
    </DependenciesProvider>
  </StrictMode>,
);
