import type { PipelineStatus } from '../../domain/enums/PipelineStatus';
import type { PullRequestStatus } from '../../domain/enums/PullRequestStatus';
import type { PullRequestReviewState } from '../../domain/enums/ReviewState';
import type { SemanticTypeOrInvalid } from '../../domain/enums/SemanticType';
import type { PullRequestView } from '../../domain/value-objects/PullRequestView';

export interface PullRequestFilters {
  q: string;
  from: string;
  to: string;
  teamId: number | null;
  developerId: number | null;
  repositoryId: number | null;
  status: PullRequestStatus | '';
  type: SemanticTypeOrInvalid | '';
  scope: string;
  review: PullRequestReviewState | '';
  pipeline: PipelineStatus | '';
  validity: 'valid' | 'invalid' | '';
  breaking: boolean;
}

export const EMPTY_FILTERS: PullRequestFilters = {
  q: '',
  from: '',
  to: '',
  teamId: null,
  developerId: null,
  repositoryId: null,
  status: '',
  type: '',
  scope: '',
  review: '',
  pipeline: '',
  validity: '',
  breaking: false,
};

export type SortKey = 'date' | 'status' | 'author' | 'semantic';
export type SortDirection = 'asc' | 'desc';
export type GroupKey = 'date' | 'team' | 'developer' | 'repository' | 'semantic' | 'status';

export interface PullRequestQuery {
  filters: PullRequestFilters;
  sortBy: SortKey;
  sortDirection: SortDirection;
  groupBy: GroupKey | '';
  page: number;
  pageSize: number;
}

export interface PullRequestGroup {
  key: string;
  items: PullRequestView[];
}

export interface PullRequestPage {
  /** Total de resultados tras aplicar filtros. */
  total: number;
  page: number;
  pageCount: number;
  items: PullRequestView[];
  groups: PullRequestGroup[];
  /** Resultado completo ordenado, útil para exportar. */
  filtered: PullRequestView[];
  /** Conteo por estado ignorando el filtro de estado (pestañas dinámicas). */
  statusCounts: Record<PullRequestStatus, number>;
  /** Valores disponibles para el filtro de scope. */
  availableScopes: string[];
}
