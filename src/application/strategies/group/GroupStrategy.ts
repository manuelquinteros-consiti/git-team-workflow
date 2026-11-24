import type { PullRequestView } from '../../../domain/value-objects/PullRequestView';
import type { GroupKey } from '../../dto/PullRequestQuery';

export interface GroupStrategy {
  key: GroupKey;
  label: string;
  keyOf(view: PullRequestView): string;
}

export const GROUP_STRATEGIES: Record<GroupKey, GroupStrategy> = {
  date: { key: 'date', label: 'Fecha', keyOf: (v) => v.pr.date },
  team: { key: 'team', label: 'Equipo', keyOf: (v) => v.team?.name ?? 'Sin equipo' },
  developer: {
    key: 'developer',
    label: 'Desarrollador',
    keyOf: (v) => v.author?.name ?? 'Sin autor',
  },
  repository: {
    key: 'repository',
    label: 'Repositorio',
    keyOf: (v) => v.repository?.name ?? 'Sin repositorio',
  },
  semantic: { key: 'semantic', label: 'Semántica', keyOf: (v) => v.semantic.type },
  status: { key: 'status', label: 'Estado', keyOf: (v) => v.pr.status },
};
