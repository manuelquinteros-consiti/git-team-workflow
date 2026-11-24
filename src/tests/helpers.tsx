import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { createDependencies } from '../app/dependencies';
import { DependenciesProvider } from '../app/providers/DependenciesProvider';
import type { PullRequestView } from '../domain/value-objects/PullRequestView';
import type { PullRequest } from '../domain/entities/PullRequest';
import { ConventionalCommitsStrategy } from '../application/strategies/semantic/ConventionalCommitsStrategy';

export const TODAY = '2025-06-15';

export function testDependencies() {
  const download = vi.fn();
  const deps = createDependencies({
    storageBackend: window.localStorage,
    clock: { today: () => TODAY },
    downloader: { download },
  });
  return { ...deps, download };
}

export function renderWithApp(ui: ReactElement, route = '/') {
  const deps = testDependencies();
  const view = render(
    <DependenciesProvider dependencies={deps}>
      <MemoryRouter
        initialEntries={[route]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        {ui}
      </MemoryRouter>
    </DependenciesProvider>,
  );
  return { ...view, deps };
}

const strategy = new ConventionalCommitsStrategy();

export function makeView(overrides: Partial<PullRequest> = {}): PullRequestView {
  const pr: PullRequest = {
    id: 1,
    title: 'feat(auth): add login',
    developerId: 1,
    repositoryId: 1,
    date: TODAY,
    hour: 10,
    status: 'Abierto',
    review: 'Pendiente',
    pipeline: 'Exitoso',
    source: 'feat/auth',
    target: 'main',
    files: 3,
    additions: 10,
    deletions: 2,
    comments: 1,
    ...overrides,
  };
  return {
    pr,
    author: { id: pr.developerId, name: 'Ana López', teamId: 1 },
    repository: { id: pr.repositoryId, name: 'frontend-app', teamId: 1 },
    team: { id: 1, name: 'Frontend' },
    semantic: strategy.analyze(pr.title),
  };
}
