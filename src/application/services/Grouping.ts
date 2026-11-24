import type { PullRequestView } from '../../domain/value-objects/PullRequestView';
import type { PullRequestGroup } from '../dto/PullRequestQuery';
import type { GroupStrategy } from '../strategies/group/GroupStrategy';

/** Agrupa conservando el orden de aparición de cada clave. Sin estrategia devuelve un único grupo. */
export function groupPullRequests(
  views: PullRequestView[],
  strategy: GroupStrategy | null,
): PullRequestGroup[] {
  if (!strategy) return views.length ? [{ key: '', items: views }] : [];
  const groups = new Map<string, PullRequestView[]>();
  for (const view of views) {
    const key = strategy.keyOf(view);
    groups.set(key, [...(groups.get(key) ?? []), view]);
  }
  return [...groups.entries()].map(([key, items]) => ({ key, items }));
}
