import type { Team } from '../../domain/entities/Team';
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository';
import type { JsonCollection } from './JsonCollection';

export class JsonTeamRepository implements ITeamRepository {
  constructor(private readonly collection: JsonCollection<Team>) {}
  async findAll() {
    return this.collection.all();
  }
  async findById(id: number) {
    return this.collection.find(id);
  }
  async save(team: Team) {
    return this.collection.upsert(team);
  }
  async remove(id: number) {
    this.collection.remove(id);
  }
}
