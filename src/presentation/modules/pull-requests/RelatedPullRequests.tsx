import { useDependencies } from '../../../app/providers/DependenciesProvider';
import { EMPTY_FILTERS, type PullRequestFilters } from '../../../application/dto/PullRequestQuery';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useUiStore } from '../../store/uiStore';
import { PullRequestItem } from './PullRequestItem';

/** Pull Requests asociados a una entidad (desarrollador, repositorio, ...). */
export function RelatedPullRequests({ filters }: { filters: Partial<PullRequestFilters> }) {
  const { useCases } = useDependencies();
  const select = useUiStore((s) => s.selectPullRequest);
  const key = JSON.stringify(filters);
  const { data, loading, error } = useAsyncData(
    () =>
      useCases.queryPullRequests.execute({
        filters: { ...EMPTY_FILTERS, ...filters },
        sortBy: 'date',
        sortDirection: 'desc',
        groupBy: '',
        page: 0,
        pageSize: 20,
      }),
    [useCases, key],
  );
  if (error) return <ErrorState message={error} />;
  if (loading || !data) return <LoadingState />;
  if (data.total === 0) return <EmptyState title="Sin Pull Requests asociados" />;
  return (
    <div>
      <small>
        Mostrando {data.items.length} de {data.total}
      </small>
      <div className="pr-list">
        {data.items.map((view) => (
          <PullRequestItem key={view.pr.id} view={view} onOpen={select} />
        ))}
      </div>
    </div>
  );
}
