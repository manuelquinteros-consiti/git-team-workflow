import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { resetPullRequestFiltersStore } from '../presentation/store/pullRequestFiltersStore';
import { useUiStore } from '../presentation/store/uiStore';

// jsdom no implementa ResizeObserver, requerido por ResponsiveContainer de Recharts.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  resetPullRequestFiltersStore();
  useUiStore.setState({ selectedPullRequestId: null, sidebarCollapsed: false });
});
