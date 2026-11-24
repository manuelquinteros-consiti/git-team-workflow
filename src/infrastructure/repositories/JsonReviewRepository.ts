import type { Review } from '../../domain/entities/Review';
import type { IReviewRepository } from '../../domain/repositories/IReviewRepository';
import type { JsonCollection } from './JsonCollection';

export class JsonReviewRepository implements IReviewRepository {
  constructor(private readonly collection: JsonCollection<Review>) {}
  async findAll() {
    return this.collection.all();
  }
  async findByPullRequestId(pullRequestId: number) {
    return this.collection.all().filter((r) => r.pullRequestId === pullRequestId);
  }
}
