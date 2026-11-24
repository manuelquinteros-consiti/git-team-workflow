import type { PullRequestView } from '../../../domain/value-objects/PullRequestView';
import { PULL_REQUEST_STATUSES } from '../../../domain/enums/PullRequestStatus';
import type { SortKey } from '../../dto/PullRequestQuery';

export interface SortStrategy {
  key: SortKey;
  label: string;
  /** Comparador ascendente. */
  compare(a: PullRequestView, b: PullRequestView): number;
}

const byDateAsc = (a: PullRequestView, b: PullRequestView) =>
  a.pr.date.localeCompare(b.pr.date) || a.pr.hour - b.pr.hour || a.pr.id - b.pr.id;

export const SORT_STRATEGIES: Record<SortKey, SortStrategy> = {
  date: { key: 'date', label: 'Fecha', compare: byDateAsc },
  status: {
    key: 'status',
    label: 'Estado',
    compare: (a, b) =>
      PULL_REQUEST_STATUSES.indexOf(a.pr.status) - PULL_REQUEST_STATUSES.indexOf(b.pr.status) ||
      byDateAsc(a, b),
  },
  author: {
    key: 'author',
    label: 'Autor',
    compare: (a, b) =>
      (a.author?.name ?? '').localeCompare(b.author?.name ?? '') || byDateAsc(a, b),
  },
  semantic: {
    key: 'semantic',
    label: 'Semántica',
    compare: (a, b) => a.semantic.type.localeCompare(b.semantic.type) || byDateAsc(a, b),
  },
};
