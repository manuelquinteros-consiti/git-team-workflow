import {
  PULL_REQUEST_STATUSES,
  type PullRequestStatus,
} from '../../../domain/enums/PullRequestStatus';
import type { PullRequestView } from '../../../domain/value-objects/PullRequestView';
import type { PullRequestPage, PullRequestQuery } from '../../dto/PullRequestQuery';
import { buildFilterSpecification } from '../../services/FilterSpecificationBuilder';
import { groupPullRequests } from '../../services/Grouping';
import { paginate } from '../../services/Pagination';
import type { PullRequestViewBuilder } from '../../services/PullRequestViewBuilder';
import { GROUP_STRATEGIES } from '../../strategies/group/GroupStrategy';
import { SORT_STRATEGIES } from '../../strategies/sort/SortStrategy';

/** Filtra, ordena, pagina y agrupa Pull Requests sin depender de React. */
export class QueryPullRequests {
  constructor(private readonly views: PullRequestViewBuilder) {}

  async execute(query: PullRequestQuery): Promise<PullRequestPage> {
    return this.run(await this.views.buildAll(), query);
  }

  run(all: PullRequestView[], query: PullRequestQuery): PullRequestPage {
    const specification = buildFilterSpecification(query.filters);
    const sorter = SORT_STRATEGIES[query.sortBy];
    const direction = query.sortDirection === 'asc' ? 1 : -1;
    const filtered = all
      .filter((v) => specification.isSatisfiedBy(v))
      .sort((a, b) => direction * sorter.compare(a, b));

    const withoutStatus = buildFilterSpecification(query.filters, ['status']);
    const statusCounts = Object.fromEntries(PULL_REQUEST_STATUSES.map((s) => [s, 0])) as Record<
      PullRequestStatus,
      number
    >;
    all
      .filter((v) => withoutStatus.isSatisfiedBy(v))
      .forEach((v) => (statusCounts[v.pr.status] += 1));

    const page = paginate(filtered, query.page, query.pageSize);
    const groupStrategy = query.groupBy ? GROUP_STRATEGIES[query.groupBy] : null;

    return {
      total: page.total,
      page: page.page,
      pageCount: page.pageCount,
      items: page.items,
      groups: groupPullRequests(page.items, groupStrategy),
      filtered,
      statusCounts,
      availableScopes: [...new Set(all.map((v) => v.semantic.scope).filter(Boolean))].sort(),
    };
  }
}
