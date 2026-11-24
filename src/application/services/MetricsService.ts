import type { PullRequestView } from '../../domain/value-objects/PullRequestView';
import { PULL_REQUEST_STATUSES } from '../../domain/enums/PullRequestStatus';
import { INVALID_SEMANTIC_TYPE, SEMANTIC_TYPES } from '../../domain/enums/SemanticType';
import { awaitingReview } from '../../domain/specifications/pullRequestSpecifications';
import { percentage } from '../../shared/utils/format';
import type { CountItem, DashboardMetrics, PullRequestSummary } from '../dto/Metrics';

function countBy(views: PullRequestView[], keyOf: (v: PullRequestView) => string): CountItem[] {
  const counts = new Map<string, number>();
  views.forEach((v) => counts.set(keyOf(v), (counts.get(keyOf(v)) ?? 0) + 1));
  return [...counts.entries()].map(([label, value]) => ({ label, value }));
}

export function summarize(views: PullRequestView[]): PullRequestSummary {
  const count = (status: string) => views.filter((v) => v.pr.status === status).length;
  return {
    total: views.length,
    open: count('Abierto'),
    merged: count('Fusionado'),
    closed: count('Cerrado'),
    draft: count('Borrador'),
    compliance: percentage(views.filter((v) => v.semantic.valid).length, views.length),
  };
}

export function computeDashboardMetrics(views: PullRequestView[], today: string): DashboardMetrics {
  const validTitles = views.filter((v) => v.semantic.valid).length;
  const review = awaitingReview();
  const daily = countBy(views, (v) => v.pr.date)
    .map(({ label, value }) => ({ date: label, count: value }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const semanticOrder = [...SEMANTIC_TYPES, INVALID_SEMANTIC_TYPE] as string[];
  const bySemantic = countBy(views, (v) => v.semantic.type).sort(
    (a, b) => semanticOrder.indexOf(a.label) - semanticOrder.indexOf(b.label),
  );
  const byStatus = countBy(views, (v) => v.pr.status).sort(
    (a, b) =>
      (PULL_REQUEST_STATUSES as readonly string[]).indexOf(a.label) -
      (PULL_REQUEST_STATUSES as readonly string[]).indexOf(b.label),
  );

  return {
    ...summarize(views),
    today: views.filter((v) => v.pr.date === today).length,
    pendingReview: views.filter((v) => review.isSatisfiedBy(v)).length,
    validTitles,
    invalidTitles: views.length - validTitles,
    breaking: views.filter((v) => v.semantic.breaking).length,
    failedPipelines: views.filter((v) => v.pr.pipeline === 'Fallido').length,
    byTeam: countBy(views, (v) => v.team?.name ?? 'Sin equipo').sort((a, b) => b.value - a.value),
    byDeveloper: countBy(views, (v) => v.author?.name ?? 'Sin autor')
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
      .slice(0, 10),
    bySemantic,
    byStatus,
    daily,
  };
}
