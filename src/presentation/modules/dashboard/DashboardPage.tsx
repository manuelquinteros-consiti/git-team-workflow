import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Clock,
  GitMerge,
  GitPullRequest,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useDependencies } from '../../../app/providers/DependenciesProvider';
import { resolveDatePreset } from '../../../application/services/DatePresets';
import {
  DailyChart,
  HorizontalBarChart,
  SemanticDistributionChart,
} from '../../components/charts/Charts';
import { MetricCard } from '../../components/common/MetricCard';
import { PageHeader } from '../../components/common/PageHeader';
import { ErrorState, LoadingState } from '../../components/common/States';
import { DateRangeFilter } from '../../components/filters/DateRangeFilter';
import { useAsyncData } from '../../hooks/useAsyncData';

export function DashboardPage() {
  const { useCases, clock } = useDependencies();
  const today = clock.today();
  const [range, setRange] = useState(() => resolveDatePreset('last30', today));
  const { data, loading, error } = useAsyncData(
    () => useCases.getDashboardMetrics.execute(range),
    [useCases, range.from, range.to],
  );

  return (
    <>
      <PageHeader title="Dashboard" description="Monitoreo de equipos y calidad de Pull Requests" />
      <section className="card">
        <DateRangeFilter from={range.from} to={range.to} today={today} onChange={setRange} />
      </section>
      {error && <ErrorState message={error} />}
      {loading && !data && <LoadingState />}
      {data && (
        <>
          <div className="metrics">
            <MetricCard
              label="PR de hoy"
              value={data.today}
              icon={<GitPullRequest size={14} />}
              hint="Pull Requests creados hoy"
            />
            <MetricCard
              label="PR en el período"
              value={data.total}
              icon={<GitPullRequest size={14} />}
            />
            <MetricCard label="Abiertos" value={data.open} icon={<CircleDot size={14} />} />
            <MetricCard label="Fusionados" value={data.merged} icon={<GitMerge size={14} />} />
            <MetricCard label="Cerrados" value={data.closed} icon={<XCircle size={14} />} />
            <MetricCard
              label="Pendientes de revisión"
              value={data.pendingReview}
              icon={<Clock size={14} />}
            />
            <MetricCard
              label="Cumplimiento semántico"
              value={data.total ? `${data.compliance}%` : '—'}
              icon={<ShieldCheck size={14} />}
              hint={`${data.validTitles} válidos, ${data.invalidTitles} inválidos`}
            />
            <MetricCard
              label="Pipelines fallidos"
              value={data.failedPipelines}
              icon={<AlertTriangle size={14} />}
            />
          </div>
          <div className="charts">
            <DailyChart data={data.daily} />
            <SemanticDistributionChart data={data.bySemantic} />
            <HorizontalBarChart title="Actividad por equipo" data={data.byTeam} color="#a371f7" />
            <HorizontalBarChart
              title="Actividad por desarrollador (top 10)"
              data={data.byDeveloper}
              color="#3fb950"
            />
          </div>
          <p className="hint">
            <CheckCircle2 size={12} /> El cumplimiento semántico mide el formato del título, no el
            contenido del código.
          </p>
        </>
      )}
    </>
  );
}
