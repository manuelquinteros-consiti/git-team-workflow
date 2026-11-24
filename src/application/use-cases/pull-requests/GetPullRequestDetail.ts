import type { Developer } from '../../../domain/entities/Developer';
import type { Review } from '../../../domain/entities/Review';
import { NotFoundError } from '../../../domain/errors/DomainError';
import type { IDeveloperRepository } from '../../../domain/repositories/IDeveloperRepository';
import type { IReviewRepository } from '../../../domain/repositories/IReviewRepository';
import type { PullRequestView } from '../../../domain/value-objects/PullRequestView';
import type { PullRequestViewBuilder } from '../../services/PullRequestViewBuilder';

export interface PullRequestDetail {
  view: PullRequestView;
  reviews: Array<{ review: Review; reviewer: Developer | undefined }>;
}

export class GetPullRequestDetail {
  constructor(
    private readonly views: PullRequestViewBuilder,
    private readonly reviews: IReviewRepository,
    private readonly developers: IDeveloperRepository,
  ) {}

  async execute(id: number): Promise<PullRequestDetail> {
    const view = (await this.views.buildAll()).find((v) => v.pr.id === id);
    if (!view) throw new NotFoundError(`No existe el Pull Request #${id}`);
    const reviews = await this.reviews.findByPullRequestId(id);
    const reviewers = await Promise.all(reviews.map((r) => this.developers.findById(r.reviewerId)));
    return { view, reviews: reviews.map((review, i) => ({ review, reviewer: reviewers[i] })) };
  }
}
