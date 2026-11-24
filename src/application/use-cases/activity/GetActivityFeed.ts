import type { PullRequestView } from '../../../domain/value-objects/PullRequestView';
import { byDateRange } from '../../../domain/specifications/pullRequestSpecifications';
import type { PullRequestViewBuilder } from '../../services/PullRequestViewBuilder';

export interface ActivityEvent {
  view: PullRequestView;
  action: 'abrió' | 'fusionó' | 'cerró' | 'creó un borrador de';
}

export interface ActivityDay {
  date: string;
  events: ActivityEvent[];
}

const ACTIONS: Record<string, ActivityEvent['action']> = {
  Abierto: 'abrió',
  Fusionado: 'fusionó',
  Cerrado: 'cerró',
  Borrador: 'creó un borrador de',
};

/** Línea de tiempo derivada del estado actual de cada Pull Request. */
export class GetActivityFeed {
  constructor(private readonly views: PullRequestViewBuilder) {}

  async execute(range: { from: string; to: string }): Promise<ActivityDay[]> {
    const spec = byDateRange(range.from, range.to);
    const sorted = (await this.views.buildAll())
      .filter((v) => spec.isSatisfiedBy(v))
      .sort(
        (a, b) => b.pr.date.localeCompare(a.pr.date) || b.pr.hour - a.pr.hour || b.pr.id - a.pr.id,
      );
    const days = new Map<string, ActivityEvent[]>();
    for (const view of sorted) {
      const events = days.get(view.pr.date) ?? [];
      events.push({ view, action: ACTIONS[view.pr.status] });
      days.set(view.pr.date, events);
    }
    return [...days.entries()].map(([date, events]) => ({ date, events }));
  }
}
