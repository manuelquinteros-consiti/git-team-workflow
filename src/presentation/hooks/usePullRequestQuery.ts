import { useDependencies } from '../../app/providers/DependenciesProvider';
import type { PullRequestFilters, PullRequestQuery } from '../../application/dto/PullRequestQuery';
import { usePullRequestFiltersStore } from '../store/pullRequestFiltersStore';
import { useAsyncData } from './useAsyncData';
import { useSettings } from './useSettings';

/** Ejecuta la consulta de Pull Requests con el estado de filtros del store. */
export function usePullRequestQuery(overrides: Partial<PullRequestFilters> = {}) {
  const { useCases } = useDependencies();
  const { settings } = useSettings();
  const s = usePullRequestFiltersStore();
  const query: PullRequestQuery = {
    filters: { ...s.filters, ...overrides },
    sortBy: s.sortBy,
    sortDirection: s.sortDirection,
    groupBy: s.groupBy,
    page: s.page,
    pageSize: s.pageSize ?? settings?.pageSize ?? 10,
  };
  const key = JSON.stringify(query);
  const result = useAsyncData(() => useCases.queryPullRequests.execute(query), [useCases, key]);
  return { ...result, query };
}
