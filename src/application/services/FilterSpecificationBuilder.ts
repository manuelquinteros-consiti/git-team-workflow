import type { PullRequestFilters } from '../dto/PullRequestQuery';
import type { PullRequestView } from '../../domain/value-objects/PullRequestView';
import { AllSpecification, type Specification } from '../../domain/specifications/Specification';
import {
  byDateRange,
  byDeveloper,
  byPipeline,
  byRepository,
  byReviewState,
  byScope,
  bySemanticType,
  bySemanticValidity,
  byStatus,
  byTeam,
  isBreakingChange,
  matchesText,
} from '../../domain/specifications/pullRequestSpecifications';

/** Traduce los filtros de la interfaz en una especificación compuesta con AND. */
export function buildFilterSpecification(
  filters: PullRequestFilters,
  ignore: ReadonlyArray<keyof PullRequestFilters> = [],
): Specification<PullRequestView> {
  const active = (key: keyof PullRequestFilters) => !ignore.includes(key);
  const parts: Array<Specification<PullRequestView>> = [];

  if (active('q') && filters.q.trim()) parts.push(matchesText(filters.q));
  if ((active('from') || active('to')) && (filters.from || filters.to))
    parts.push(byDateRange(filters.from, filters.to));
  if (active('teamId') && filters.teamId !== null) parts.push(byTeam(filters.teamId));
  if (active('developerId') && filters.developerId !== null)
    parts.push(byDeveloper(filters.developerId));
  if (active('repositoryId') && filters.repositoryId !== null)
    parts.push(byRepository(filters.repositoryId));
  if (active('status') && filters.status) parts.push(byStatus(filters.status));
  if (active('type') && filters.type) parts.push(bySemanticType(filters.type));
  if (active('scope') && filters.scope) parts.push(byScope(filters.scope));
  if (active('review') && filters.review) parts.push(byReviewState(filters.review));
  if (active('pipeline') && filters.pipeline) parts.push(byPipeline(filters.pipeline));
  if (active('validity') && filters.validity) {
    const valid = bySemanticValidity(true);
    parts.push(filters.validity === 'valid' ? valid : valid.not());
  }
  if (active('breaking') && filters.breaking) parts.push(isBreakingChange());

  return parts.reduce<Specification<PullRequestView>>(
    (acc, part) => acc.and(part),
    new AllSpecification<PullRequestView>(),
  );
}
