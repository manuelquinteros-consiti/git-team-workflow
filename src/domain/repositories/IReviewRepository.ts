import type { Review } from '../entities/Review';

export interface IReviewRepository {
  findAll(): Promise<Review[]>;
  findByPullRequestId(pullRequestId: number): Promise<Review[]>;
}
