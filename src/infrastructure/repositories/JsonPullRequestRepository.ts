import type { PullRequest } from '../../domain/entities/PullRequest';
import type { IPullRequestRepository } from '../../domain/repositories/IPullRequestRepository';
import type { JsonCollection } from './JsonCollection';

export class JsonPullRequestRepository implements IPullRequestRepository {
  constructor(private readonly collection: JsonCollection<PullRequest>) {}
  async findAll() {
    return this.collection.all();
  }
  async findById(id: number) {
    return this.collection.find(id);
  }
}
