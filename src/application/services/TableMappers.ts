import type { PullRequestView } from '../../domain/value-objects/PullRequestView';
import type { TableData } from '../../shared/types';

export function pullRequestsToTable(views: PullRequestView[]): TableData {
  return {
    columns: [
      'ID',
      'Título',
      'Autor',
      'Equipo',
      'Repositorio',
      'Fecha',
      'Estado',
      'Semántica',
      'Scope',
      'Válido',
      'Breaking',
      'Revisión',
      'Pipeline',
    ],
    rows: views.map((v) => [
      v.pr.id,
      v.pr.title,
      v.author?.name ?? '',
      v.team?.name ?? '',
      v.repository?.name ?? '',
      v.pr.date,
      v.pr.status,
      v.semantic.type,
      v.semantic.scope,
      v.semantic.valid ? 'Sí' : 'No',
      v.semantic.breaking ? 'Sí' : 'No',
      v.pr.review,
      v.pr.pipeline,
    ]),
  };
}
