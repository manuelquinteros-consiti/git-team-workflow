import type { Repository } from '../../domain/entities/Repository';
import type { IGitRepository } from '../../domain/repositories/IGitRepository';
import type { JsonCollection } from './JsonCollection';

export class JsonGitRepository implements IGitRepository {
  constructor(private readonly collection: JsonCollection<Repository>) {}
  async findAll() {
    return this.collection.all();
  }
  async findById(id: number) {
    return this.collection.find(id);
  }
  async save(repository: Repository) {
    return this.collection.upsert(repository);
  }
  async remove(id: number) {
    this.collection.remove(id);
  }
}
