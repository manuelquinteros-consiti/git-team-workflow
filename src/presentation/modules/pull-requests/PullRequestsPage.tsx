import { ChevronDown, ChevronRight, Download } from 'lucide-react';
import { useDependencies } from '../../../app/providers/DependenciesProvider';
import { PULL_REQUEST_STATUSES } from '../../../domain/enums/PullRequestStatus';
import { GROUP_STRATEGIES } from '../../../application/strategies/group/GroupStrategy';
import { SORT_STRATEGIES } from '../../../application/strategies/sort/SortStrategy';
import type { GroupKey, SortKey } from '../../../application/dto/PullRequestQuery';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States';
import { PageHeader } from '../../components/common/PageHeader';
import { Pagination } from '../../components/common/Pagination';
import { PullRequestFilterBar } from '../../components/filters/PullRequestFilterBar';
import { useActionRunner } from '../../hooks/useNotify';
import { usePullRequestQuery } from '../../hooks/usePullRequestQuery';
import { useSettings } from '../../hooks/useSettings';
import { usePullRequestFiltersStore } from '../../store/pullRequestFiltersStore';
import { useUiStore } from '../../store/uiStore';
import { PullRequestItem } from './PullRequestItem';

export function PullRequestsPage() {
  const { useCases } = useDependencies();
  const run = useActionRunner();
  const { settings } = useSettings();
  const select = useUiStore((s) => s.selectPullRequest);
  const store = usePullRequestFiltersStore();
  const { data, error, loading, query } = usePullRequestQuery();

  const exportResults = (format: string) =>
    data &&
    run(
      async () => useCases.exportPullRequests.execute(data, format),
      `Exportados ${data.total} Pull Requests (${format.toUpperCase()})`,
    );

  return (
    <>
      <PageHeader
        title="Pull Requests"
        description="Monitoreo de equipos y calidad semántica de los Pull Requests"
        actions={
          <>
            <button
              type="button"
              disabled={!data || data.total === 0}
              onClick={() => exportResults('csv')}
            >
              <Download size={14} /> Exportar CSV
            </button>
            <button
              type="button"
              disabled={!data || data.total === 0}
              onClick={() => exportResults('json')}
            >
              <Download size={14} /> Exportar JSON
            </button>
          </>
        }
      />
      <PullRequestFilterBar availableScopes={data?.availableScopes ?? []} />

      {error && <ErrorState message={error} />}
      {!error && (
        <section className="card">
          <div className="tabs" role="tablist" aria-label="Estado">
            <button
              type="button"
              role="tab"
              aria-selected={store.filters.status === ''}
              className={store.filters.status === '' ? 'chip selected' : 'chip'}
              onClick={() => store.setFilter('status', '')}
            >
              Todos {data && <b>{Object.values(data.statusCounts).reduce((a, b) => a + b, 0)}</b>}
            </button>
            {PULL_REQUEST_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                role="tab"
                aria-selected={store.filters.status === status}
                className={store.filters.status === status ? 'chip selected' : 'chip'}
                onClick={() => store.setFilter('status', status)}
              >
                {status} {data && <b>{data.statusCounts[status]}</b>}
              </button>
            ))}
          </div>

          <div className="list-tools">
            <strong aria-live="polite">{data ? `${data.total} resultados` : '…'}</strong>
            <label>
              Ordenar por
              <select
                value={query.sortBy}
                onChange={(e) => store.setSort(e.target.value as SortKey, query.sortDirection)}
              >
                {Object.values(SORT_STRATEGIES).map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() =>
                store.setSort(query.sortBy, query.sortDirection === 'asc' ? 'desc' : 'asc')
              }
            >
              {query.sortDirection === 'asc' ? 'Ascendente ↑' : 'Descendente ↓'}
            </button>
            <label>
              Agrupar por
              <select
                value={query.groupBy}
                onChange={(e) => store.setGroupBy(e.target.value as GroupKey | '')}
              >
                <option value="">Sin agrupación</option>
                {Object.values(GROUP_STRATEGIES).map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loading && !data && <LoadingState />}
          {data && data.total === 0 && (
            <EmptyState title="No hay Pull Requests con estos filtros">
              Ajusta o limpia los filtros para ver más resultados.
            </EmptyState>
          )}
          {data?.groups.map((group) => {
            const collapsed = store.collapsedGroups.includes(group.key);
            return (
              <div className="pr-group" key={group.key || 'all'}>
                {group.key && (
                  <button
                    type="button"
                    className="group-header"
                    aria-expanded={!collapsed}
                    onClick={() => store.toggleGroup(group.key)}
                  >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />} {group.key}{' '}
                    <b>{group.items.length}</b>
                  </button>
                )}
                {!collapsed && (
                  <div className="pr-list">
                    {group.items.map((view) => (
                      <PullRequestItem
                        key={view.pr.id}
                        view={view}
                        showAvatar={settings?.showAvatars ?? true}
                        onOpen={select}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {data && (
            <Pagination
              page={data.page}
              pageCount={data.pageCount}
              pageSize={query.pageSize}
              total={data.total}
              onPageChange={store.setPage}
              onPageSizeChange={store.setPageSize}
            />
          )}
        </section>
      )}
    </>
  );
}
