import type { PipelineStatus } from '../enums/PipelineStatus';
import type { PullRequestStatus } from '../enums/PullRequestStatus';
import type { PullRequestReviewState } from '../enums/ReviewState';
import type { SemanticTypeOrInvalid } from '../enums/SemanticType';
import { DateRange } from '../value-objects/DateRange';
import type { PullRequestView } from '../value-objects/PullRequestView';
import { PredicateSpecification, type Specification } from './Specification';

type PrSpec = Specification<PullRequestView>;
const spec = (predicate: (v: PullRequestView) => boolean): PrSpec =>
  new PredicateSpecification(predicate);

export const byTeam = (teamId: number): PrSpec => spec((v) => v.team?.id === teamId);
export const byDeveloper = (id: number): PrSpec => spec((v) => v.pr.developerId === id);
export const byRepository = (id: number): PrSpec => spec((v) => v.pr.repositoryId === id);
export const byDateRange = (from: string, to: string): PrSpec => {
  const range = new DateRange(from, to);
  return spec((v) => range.contains(v.pr.date));
};
export const byStatus = (status: PullRequestStatus): PrSpec => spec((v) => v.pr.status === status);
export const bySemanticType = (type: SemanticTypeOrInvalid): PrSpec =>
  spec((v) => v.semantic.type === type);
export const byScope = (scope: string): PrSpec => spec((v) => v.semantic.scope === scope);
export const byReviewState = (state: PullRequestReviewState): PrSpec =>
  spec((v) => v.pr.review === state);
export const byPipeline = (status: PipelineStatus): PrSpec => spec((v) => v.pr.pipeline === status);
export const bySemanticValidity = (valid: boolean): PrSpec =>
  spec((v) => v.semantic.valid === valid);
export const isBreakingChange = (): PrSpec => spec((v) => v.semantic.breaking);

/** Búsqueda de texto libre por título, número, autor, repositorio, equipo y ramas. */
export const matchesText = (query: string): PrSpec => {
  const needle = query.trim().toLowerCase().replace(/^#/, '');
  return spec((v) => {
    const haystack = [
      v.pr.title,
      String(v.pr.id),
      v.author?.name,
      v.repository?.name,
      v.team?.name,
      v.pr.source,
      v.pr.target,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(needle);
  });
};

/** Pull Requests que esperan una revisión: composición con OR. */
export const awaitingReview = (): PrSpec =>
  byReviewState('Pendiente').or(byReviewState('En revisión'));
