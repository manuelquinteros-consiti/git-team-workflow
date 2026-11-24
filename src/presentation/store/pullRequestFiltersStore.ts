import { create } from 'zustand';
import {
  EMPTY_FILTERS,
  type GroupKey,
  type PullRequestFilters,
  type SortDirection,
  type SortKey,
} from '../../application/dto/PullRequestQuery';

interface PullRequestFiltersState {
  filters: PullRequestFilters;
  sortBy: SortKey;
  sortDirection: SortDirection;
  groupBy: GroupKey | '';
  page: number;
  /** null = usar el tamaño definido en Configuración. */
  pageSize: number | null;
  collapsedGroups: string[];
  setFilter: <K extends keyof PullRequestFilters>(key: K, value: PullRequestFilters[K]) => void;
  patchFilters: (patch: Partial<PullRequestFilters>) => void;
  removeFilter: (key: keyof PullRequestFilters | 'dates') => void;
  clearFilters: () => void;
  setSort: (sortBy: SortKey, direction?: SortDirection) => void;
  setGroupBy: (groupBy: GroupKey | '') => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  toggleGroup: (key: string) => void;
}

const initial = {
  filters: EMPTY_FILTERS,
  sortBy: 'date' as SortKey,
  sortDirection: 'desc' as SortDirection,
  groupBy: '' as GroupKey | '',
  page: 0,
  pageSize: null as number | null,
  collapsedGroups: [] as string[],
};

export const usePullRequestFiltersStore = create<PullRequestFiltersState>((set) => ({
  ...initial,
  setFilter: (key, value) => set((s) => ({ filters: { ...s.filters, [key]: value }, page: 0 })),
  patchFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch }, page: 0 })),
  removeFilter: (key) =>
    set((s) => {
      const patch: Partial<PullRequestFilters> =
        key === 'dates' ? { from: '', to: '' } : { [key]: EMPTY_FILTERS[key] };
      return { filters: { ...s.filters, ...patch }, page: 0 };
    }),
  clearFilters: () => set({ filters: EMPTY_FILTERS, page: 0 }),
  setSort: (sortBy, direction) =>
    set((s) => ({
      sortBy,
      sortDirection:
        direction ?? (s.sortBy === sortBy && s.sortDirection === 'desc' ? 'asc' : 'desc'),
      page: 0,
    })),
  setGroupBy: (groupBy) => set({ groupBy, collapsedGroups: [], page: 0 }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 0 }),
  toggleGroup: (key) =>
    set((s) => ({
      collapsedGroups: s.collapsedGroups.includes(key)
        ? s.collapsedGroups.filter((k) => k !== key)
        : [...s.collapsedGroups, key],
    })),
}));

export function resetPullRequestFiltersStore(): void {
  usePullRequestFiltersStore.setState(initial);
}
