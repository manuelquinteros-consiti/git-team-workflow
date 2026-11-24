import { Download } from 'lucide-react';
import { useState } from 'react';
import { useDependencies } from '../../../app/providers/DependenciesProvider';
import { resolveDatePreset } from '../../../application/services/DatePresets';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States';
import { DateRangeFilter } from '../../components/filters/DateRangeFilter';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useActionRunner } from '../../hooks/useNotify';

export function ReportsPage() {
  const { useCases, clock } = useDependencies();
  const run = useActionRunner();
  const today = clock.today();
  const reports = useCases.generateReport.listReports();
  const [reportId, setReportId] = useState(reports[0].id);
  const [range, setRange] = useState(() => resolveDatePreset('last30', today));
  const { data, loading, error } = useAsyncData(
    () => useCases.generateReport.execute({ reportId, ...range }),
    [useCases, reportId, range.from, range.to],
  );
  const label = reports.find((r) => r.id === reportId)?.label ?? reportId;

  return (
    <>
      <PageHeader
        title="Reportes"
        description="Resúmenes por período, equipo, desarrollador, repositorio y cumplimiento semántico"
        actions={useCases.exportTable.listFormats().map((format) => (
          <button
            key={format.id}
            type="button"
            disabled={!data || data.rows.length === 0}
            onClick={() =>
              data &&
              run(
                async () => useCases.exportTable.execute(data, `reporte-${reportId}`, format.id),
                `Reporte exportado (${format.label})`,
              )
            }
          >
            <Download size={14} /> Exportar {format.label}
          </button>
        ))}
      />
      <section className="card">
        <label>
          Tipo de reporte
          <select value={reportId} onChange={(e) => setReportId(e.target.value)}>
            {reports.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <DateRangeFilter from={range.from} to={range.to} today={today} onChange={setRange} />
      </section>
      {error && <ErrorState message={error} />}
      {loading && !data && <LoadingState />}
      {data && (
        <section className="card table-wrap">
          <h2>Reporte {label.toLowerCase()}</h2>
          {data.rows.length === 0 ? (
            <EmptyState title="Sin datos para el período seleccionado" />
          ) : (
            <table>
              <thead>
                <tr>
                  {data.columns.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </>
  );
}
