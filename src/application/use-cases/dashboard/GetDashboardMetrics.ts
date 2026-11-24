import { byDateRange } from '../../../domain/specifications/pullRequestSpecifications';
import type { IClock } from '../../ports/IClock';
import type { DashboardMetrics } from '../../dto/Metrics';
import { computeDashboardMetrics } from '../../services/MetricsService';
import type { PullRequestViewBuilder } from '../../services/PullRequestViewBuilder';

export class GetDashboardMetrics {
  constructor(
    private readonly views: PullRequestViewBuilder,
    private readonly clock: IClock,
  ) {}

  async execute(range: { from: string; to: string }): Promise<DashboardMetrics> {
    const spec = byDateRange(range.from, range.to);
    const views = (await this.views.buildAll()).filter((v) => spec.isSatisfiedBy(v));
    return computeDashboardMetrics(views, this.clock.today());
  }
}
