import type { Developer } from '../../domain/entities/Developer';
import type { IDeveloperRepository } from '../../domain/repositories/IDeveloperRepository';
import type { JsonCollection } from './JsonCollection';

export class JsonDeveloperRepository implements IDeveloperRepository {
  constructor(private readonly collection: JsonCollection<Developer>) {}
  async findAll() {
    return this.collection.all();
  }
  async findById(id: number) {
    return this.collection.find(id);
  }
  async save(developer: Developer) {
    return this.collection.upsert(developer);
  }
  async remove(id: number) {
    this.collection.remove(id);
  }
}
