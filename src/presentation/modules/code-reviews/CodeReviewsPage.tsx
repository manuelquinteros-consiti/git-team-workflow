import { useState } from 'react';
import { useDependencies } from '../../../app/providers/DependenciesProvider';
import type { ReviewStatus } from '../../../domain/enums/ReviewState';
import { Avatar } from '../../components/common/Avatar';
import { Badge, STATUS_TONE } from '../../components/common/Badge';
import { MetricCard } from '../../components/common/MetricCard';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useUiStore } from '../../store/uiStore';

const TABS: Array<ReviewStatus | 'Todas'> = [
  'Todas',
  'Pendiente',
  'Aprobado',
  'Cambios solicitados',
];

export function CodeReviewsPage() {
  const { useCases } = useDependencies();
  const select = useUiStore((s) => s.selectPullRequest);
  const [tab, setTab] = useState<ReviewStatus | 'Todas'>('Pendiente');
  const { data, loading, error } = useAsyncData(
    () => useCases.getCodeReviews.execute(),
    [useCases],
  );
  const items = data?.items.filter((i) => tab === 'Todas' || i.review.status === tab) ?? [];

  return (
    <>
      <PageHeader
        title="Code Reviews"
        description="Revisiones pendientes, aprobadas y con cambios solicitados"
      />
      {error && <ErrorState message={error} />}
      {loading && !data && <LoadingState />}
      {data && (
        <>
          <div className="metrics">
            <MetricCard label="Pendientes" value={data.pending} />
            <MetricCard label="Aprobadas" value={data.approved} />
            <MetricCard label="Cambios solicitados" value={data.changesRequested} />
            <MetricCard
              label="Tiempo medio de revisión"
              value={data.averageHours === null ? '—' : `${data.averageHours} h`}
            />
          </div>
          <section className="card">
            <div className="tabs" role="tablist">
              {TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  className={tab === t ? 'chip selected' : 'chip'}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            {items.length === 0 ? (
              <EmptyState title="No hay revisiones en esta categoría" />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Pull Request</th>
                      <th>Revisor</th>
                      <th>Estado</th>
                      <th>Tiempo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.slice(0, 50).map(({ review, reviewer, view }) => (
                      <tr key={review.id}>
                        <td>
                          <button
                            type="button"
                            className="title-button"
                            onClick={() => select(review.pullRequestId)}
                          >
                            #{review.pullRequestId} {view?.pr.title}
                          </button>
                        </td>
                        <td>
                          <span className="inline">
                            <Avatar name={reviewer?.name ?? '?'} size={20} />{' '}
                            {reviewer?.name ?? '—'}
                          </span>
                        </td>
                        <td>
                          <Badge tone={STATUS_TONE[review.status]}>{review.status}</Badge>
                        </td>
                        <td>
                          {review.responseHours === null
                            ? 'Sin responder'
                            : `${review.responseHours} h`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {items.length > 50 && <small>Mostrando 50 de {items.length}.</small>}
              </div>
            )}
          </section>
          <section className="card table-wrap">
            <h2>Carga por revisor</h2>
            <table>
              <thead>
                <tr>
                  <th>Revisor</th>
                  <th>Asignadas</th>
                  <th>Pendientes</th>
                  <th>Tiempo medio</th>
                </tr>
              </thead>
              <tbody>
                {data.byReviewer.map((r) => (
                  <tr key={r.reviewer}>
                    <td>{r.reviewer}</td>
                    <td>{r.assigned}</td>
                    <td>{r.pending}</td>
                    <td>{r.averageHours === null ? '—' : `${r.averageHours} h`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </>
  );
}
