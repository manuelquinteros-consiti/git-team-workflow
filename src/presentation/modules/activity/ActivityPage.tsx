import { useState } from 'react';
import { useDependencies } from '../../../app/providers/DependenciesProvider';
import { resolveDatePreset } from '../../../application/services/DatePresets';
import { Avatar } from '../../components/common/Avatar';
import { Badge, STATUS_TONE } from '../../components/common/Badge';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States';
import { DateRangeFilter } from '../../components/filters/DateRangeFilter';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useUiStore } from '../../store/uiStore';

export function ActivityPage() {
  const { useCases, clock } = useDependencies();
  const select = useUiStore((s) => s.selectPullRequest);
  const today = clock.today();
  const [range, setRange] = useState(() => resolveDatePreset('last7', today));
  const { data, loading, error } = useAsyncData(
    () => useCases.getActivityFeed.execute(range),
    [useCases, range.from, range.to],
  );

  return (
    <>
      <PageHeader title="Actividad" description="Línea de tiempo derivada de los Pull Requests" />
      <section className="card">
        <DateRangeFilter from={range.from} to={range.to} today={today} onChange={setRange} />
      </section>
      {error && <ErrorState message={error} />}
      {loading && !data && <LoadingState />}
      {data?.length === 0 && <EmptyState title="Sin actividad en el período" />}
      {data?.map((day) => (
        <section className="card" key={day.date}>
          <h2>
            {day.date} <small>{day.events.length} eventos</small>
          </h2>
          <ul className="plain-list">
            {day.events.map(({ view, action }) => (
              <li key={view.pr.id} className="activity-item">
                <Avatar name={view.author?.name ?? '?'} size={22} />
                <span>
                  <b>{view.author?.name ?? 'Alguien'}</b> {action}{' '}
                  <button type="button" className="title-button" onClick={() => select(view.pr.id)}>
                    #{view.pr.id} {view.pr.title}
                  </button>{' '}
                  en <i>{view.repository?.name}</i>
                </span>
                <Badge tone={STATUS_TONE[view.pr.status]}>{view.pr.status}</Badge>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
