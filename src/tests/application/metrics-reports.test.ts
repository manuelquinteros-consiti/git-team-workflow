import { describe, expect, it } from 'vitest';
import { computeDashboardMetrics, summarize } from '../../application/services/MetricsService';
import {
  CsvExportStrategy,
  JsonExportStrategy,
} from '../../application/strategies/export/ExportStrategy';
import { REPORT_STRATEGIES } from '../../application/strategies/report/ReportStrategy';
import { pullRequestsToTable } from '../../application/services/TableMappers';
import { EMPTY_FILTERS } from '../../application/dto/PullRequestQuery';
import { makeView, testDependencies, TODAY } from '../helpers';

const views = [
  makeView({ id: 1, status: 'Abierto', review: 'Pendiente', date: TODAY }),
  makeView({ id: 2, status: 'Fusionado', title: 'Update code', date: '2025-06-14' }),
  makeView({
    id: 3,
    status: 'Cerrado',
    title: 'fix(api)!: x',
    pipeline: 'Fallido',
    date: '2025-06-14',
  }),
  makeView({ id: 4, status: 'Borrador', review: 'Aprobado', date: '2025-06-01' }),
];

describe('MetricsService', () => {
  it('resume estados y cumplimiento', () => {
    expect(summarize(views)).toEqual({
      total: 4,
      open: 1,
      merged: 1,
      closed: 1,
      draft: 1,
      compliance: 75,
    });
    expect(summarize([]).compliance).toBe(0);
  });

  it('calcula métricas del dashboard', () => {
    const m = computeDashboardMetrics(views, TODAY);
    expect(m).toMatchObject({
      today: 1,
      pendingReview: 3,
      validTitles: 3,
      invalidTitles: 1,
      breaking: 1,
      failedPipelines: 1,
    });
    expect(m.daily).toEqual([
      { date: '2025-06-01', count: 1 },
      { date: '2025-06-14', count: 2 },
      { date: '2025-06-15', count: 1 },
    ]);
    expect(m.bySemantic.find((s) => s.label === 'Inválido')?.value).toBe(1);
  });

  it('el dashboard del sistema real suma 200 PR sin filtro de fechas', async () => {
    const { useCases } = testDependencies();
    const m = await useCases.getDashboardMetrics.execute({ from: '', to: '' });
    expect(m.total).toBe(200);
    expect(m.open + m.merged + m.closed + m.draft).toBe(200);
    const week = await useCases.getDashboardMetrics.execute({ from: '2025-06-09', to: TODAY });
    expect(week.total).toBeLessThan(200);
  });
});

describe('Reportes y exportación', () => {
  it('genera cada reporte con columnas y filas coherentes', () => {
    for (const strategy of REPORT_STRATEGIES) {
      const table = strategy.build(views);
      expect(table.rows.length).toBeGreaterThan(0);
      table.rows.forEach((row) => expect(row).toHaveLength(table.columns.length));
    }
    const monthly = REPORT_STRATEGIES.find((r) => r.id === 'monthly')!.build(views);
    expect(monthly.rows).toEqual([['2025-06', 4, 1, 1, 1, 1, 75]]);
    const weekly = REPORT_STRATEGIES.find((r) => r.id === 'weekly')!.build(views);
    expect(weekly.rows.map((r) => r[0])).toEqual(['2025-06-09', '2025-05-26']);
  });

  it('exporta CSV con escape de comillas y neutralización de fórmulas', () => {
    const csv = new CsvExportStrategy().serialize({
      columns: ['A', 'B'],
      rows: [
        ['=SUM(1)', 'dice "hola"'],
        ['-5', 7],
      ],
    });
    expect(csv.startsWith('\ufeff"A","B"')).toBe(true);
    expect(csv).toContain(`"'=SUM(1)","dice ""hola"""`);
    expect(csv).toContain(`"'-5","7"`);
  });

  it('exporta JSON con objetos por fila', () => {
    const json = JSON.parse(
      new JsonExportStrategy().serialize({ columns: ['A', 'B'], rows: [[1, 'x']] }),
    );
    expect(json).toEqual([{ A: 1, B: 'x' }]);
  });

  it('exporta los resultados filtrados mediante el puerto de descarga', async () => {
    const { useCases, download } = testDependencies();
    const page = await useCases.queryPullRequests.execute({
      filters: { ...EMPTY_FILTERS, status: 'Cerrado' },
      sortBy: 'date',
      sortDirection: 'desc',
      groupBy: '',
      page: 0,
      pageSize: 10,
    });
    const filename = useCases.exportPullRequests.execute(page, 'csv');
    expect(filename).toBe('pull-requests.csv');
    expect(download).toHaveBeenCalledOnce();
    const [, content, mime] = download.mock.calls[0];
    expect(mime).toContain('text/csv');
    expect(content.split('\n')).toHaveLength(page.total + 1);
    expect(() => useCases.exportPullRequests.execute(page, 'xlsx')).toThrow(/desconocido/);
  });

  it('pullRequestsToTable incluye columnas semánticas', () => {
    const table = pullRequestsToTable([makeView()]);
    expect(table.columns).toContain('Scope');
    expect(table.rows[0]).toContain('feat');
  });
});
