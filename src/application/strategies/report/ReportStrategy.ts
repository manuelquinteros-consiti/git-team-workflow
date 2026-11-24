import type { PullRequestView } from '../../../domain/value-objects/PullRequestView';
import type { TableData } from '../../../shared/types';
import { percentage } from '../../../shared/utils/format';
import { monthKey, startOfWeek } from '../../../shared/utils/dates';

export interface ReportStrategy {
  id: string;
  label: string;
  build(views: PullRequestView[]): TableData;
}

function groupBy(views: PullRequestView[], keyOf: (v: PullRequestView) => string) {
  const groups = new Map<string, PullRequestView[]>();
  for (const view of views) {
    const key = keyOf(view);
    groups.set(key, [...(groups.get(key) ?? []), view]);
  }
  return groups;
}

const SUMMARY_COLUMNS = [
  'Total',
  'Abiertos',
  'Fusionados',
  'Cerrados',
  'Borradores',
  'Cumplimiento %',
];

function summaryRow(items: PullRequestView[]): number[] {
  const count = (status: string) => items.filter((v) => v.pr.status === status).length;
  const valid = items.filter((v) => v.semantic.valid).length;
  return [
    items.length,
    count('Abierto'),
    count('Fusionado'),
    count('Cerrado'),
    count('Borrador'),
    percentage(valid, items.length),
  ];
}

/** Reporte genérico: agrupa por una clave y resume estados y cumplimiento. */
export class GroupedSummaryReport implements ReportStrategy {
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly dimension: string,
    private readonly keyOf: (v: PullRequestView) => string,
    private readonly descending = false,
  ) {}

  build(views: PullRequestView[]): TableData {
    const keys = [...groupBy(views, this.keyOf).entries()].sort(([a], [b]) =>
      this.descending ? b.localeCompare(a) : a.localeCompare(b),
    );
    return {
      columns: [this.dimension, ...SUMMARY_COLUMNS],
      rows: keys.map(([key, items]) => [key, ...summaryRow(items)]),
    };
  }
}

/** Cumplimiento semántico por tipo, incluyendo Breaking Changes. */
export class SemanticComplianceReport implements ReportStrategy {
  readonly id = 'compliance';
  readonly label = 'Cumplimiento semántico';

  build(views: PullRequestView[]): TableData {
    const groups = [...groupBy(views, (v) => v.semantic.type).entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    );
    return {
      columns: ['Tipo', 'Total', 'Válidos', 'Inválidos', 'Cumplimiento %', 'Breaking'],
      rows: groups.map(([type, items]) => {
        const valid = items.filter((v) => v.semantic.valid).length;
        return [
          type,
          items.length,
          valid,
          items.length - valid,
          percentage(valid, items.length),
          items.filter((v) => v.semantic.breaking).length,
        ];
      }),
    };
  }
}

export const REPORT_STRATEGIES: ReportStrategy[] = [
  new GroupedSummaryReport('daily', 'Diario', 'Fecha', (v) => v.pr.date, true),
  new GroupedSummaryReport(
    'weekly',
    'Semanal',
    'Semana (lunes)',
    (v) => startOfWeek(v.pr.date),
    true,
  ),
  new GroupedSummaryReport('monthly', 'Mensual', 'Mes', (v) => monthKey(v.pr.date), true),
  new GroupedSummaryReport('team', 'Por equipo', 'Equipo', (v) => v.team?.name ?? 'Sin equipo'),
  new GroupedSummaryReport(
    'developer',
    'Por desarrollador',
    'Desarrollador',
    (v) => v.author?.name ?? 'Sin autor',
  ),
  new GroupedSummaryReport(
    'repository',
    'Por repositorio',
    'Repositorio',
    (v) => v.repository?.name ?? 'Sin repositorio',
  ),
  new SemanticComplianceReport(),
];
