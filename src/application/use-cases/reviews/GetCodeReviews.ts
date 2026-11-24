import type { Developer } from '../../../domain/entities/Developer';
import type { Review } from '../../../domain/entities/Review';
import type { IDeveloperRepository } from '../../../domain/repositories/IDeveloperRepository';
import type { IReviewRepository } from '../../../domain/repositories/IReviewRepository';
import type { PullRequestView } from '../../../domain/value-objects/PullRequestView';
import { average } from '../../../shared/utils/format';
import type { PullRequestViewBuilder } from '../../services/PullRequestViewBuilder';

export interface ReviewItem {
  review: Review;
  reviewer: Developer | undefined;
  view: PullRequestView | undefined;
}

export interface ReviewerLoad {
  reviewer: string;
  assigned: number;
  pending: number;
  averageHours: number | null;
}

export interface CodeReviewsOverview {
  items: ReviewItem[];
  pending: number;
  approved: number;
  changesRequested: number;
  averageHours: number | null;
  byReviewer: ReviewerLoad[];
}

export class GetCodeReviews {
  constructor(
    private readonly reviews: IReviewRepository,
    private readonly developers: IDeveloperRepository,
    private readonly views: PullRequestViewBuilder,
  ) {}

  async execute(): Promise<CodeReviewsOverview> {
    const [reviews, developers, views] = await Promise.all([
      this.reviews.findAll(),
      this.developers.findAll(),
      this.views.buildAll(),
    ]);
    const viewById = new Map(views.map((v) => [v.pr.id, v]));
    const developerById = new Map(developers.map((d) => [d.id, d]));
    const items = reviews.map((review) => ({
      review,
      reviewer: developerById.get(review.reviewerId),
      view: viewById.get(review.pullRequestId),
    }));

    const hours = (list: Review[]) =>
      list.map((r) => r.responseHours).filter((h): h is number => h !== null);
    const reviewerIds = [...new Set(reviews.map((r) => r.reviewerId))];
    const byReviewer = reviewerIds
      .map((id) => {
        const own = reviews.filter((r) => r.reviewerId === id);
        return {
          reviewer: developerById.get(id)?.name ?? `#${id}`,
          assigned: own.length,
          pending: own.filter((r) => r.status === 'Pendiente').length,
          averageHours: average(hours(own)),
        };
      })
      .sort((a, b) => b.pending - a.pending || b.assigned - a.assigned);

    return {
      items,
      pending: reviews.filter((r) => r.status === 'Pendiente').length,
      approved: reviews.filter((r) => r.status === 'Aprobado').length,
      changesRequested: reviews.filter((r) => r.status === 'Cambios solicitados').length,
      averageHours: average(hours(reviews)),
      byReviewer,
    };
  }
}
