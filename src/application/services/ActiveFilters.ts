import type { Developer } from '../../domain/entities/Developer';
import type { Repository } from '../../domain/entities/Repository';
import type { Team } from '../../domain/entities/Team';
import type { PullRequestFilters } from '../dto/PullRequestQuery';

export interface ActiveFilter {
  key: keyof PullRequestFilters | 'dates';
  label: string;
}

interface Lookups {
  teams: Team[];
  developers: Developer[];
  repositories: Repository[];
}

/** Describe los filtros activos para mostrarlos como etiquetas removibles. */
export function describeActiveFilters(
  f: PullRequestFilters,
  { teams, developers, repositories }: Lookups,
): ActiveFilter[] {
  const out: ActiveFilter[] = [];
  if (f.q.trim()) out.push({ key: 'q', label: `Búsqueda: ${f.q.trim()}` });
  if (f.from || f.to) {
    const label = f.from === f.to ? f.from : `${f.from || '…'} → ${f.to || '…'}`;
    out.push({ key: 'dates', label: `Fecha: ${label}` });
  }
  if (f.teamId !== null)
    out.push({
      key: 'teamId',
      label: `Equipo: ${teams.find((t) => t.id === f.teamId)?.name ?? f.teamId}`,
    });
  if (f.developerId !== null)
    out.push({
      key: 'developerId',
      label: `Autor: ${developers.find((d) => d.id === f.developerId)?.name ?? f.developerId}`,
    });
  if (f.repositoryId !== null)
    out.push({
      key: 'repositoryId',
      label: `Repositorio: ${repositories.find((r) => r.id === f.repositoryId)?.name ?? f.repositoryId}`,
    });
  if (f.status) out.push({ key: 'status', label: `Estado: ${f.status}` });
  if (f.type) out.push({ key: 'type', label: `Tipo: ${f.type}` });
  if (f.scope) out.push({ key: 'scope', label: `Scope: ${f.scope}` });
  if (f.review) out.push({ key: 'review', label: `Revisión: ${f.review}` });
  if (f.pipeline) out.push({ key: 'pipeline', label: `Pipeline: ${f.pipeline}` });
  if (f.validity)
    out.push({
      key: 'validity',
      label: f.validity === 'valid' ? 'Semántica válida' : 'Semántica inválida',
    });
  if (f.breaking) out.push({ key: 'breaking', label: 'Breaking changes' });
  return out;
}
