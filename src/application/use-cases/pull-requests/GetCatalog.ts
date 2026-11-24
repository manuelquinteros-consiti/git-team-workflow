import type { Developer } from '../../../domain/entities/Developer';
import type { Repository } from '../../../domain/entities/Repository';
import type { Team } from '../../../domain/entities/Team';
import type { IDeveloperRepository } from '../../../domain/repositories/IDeveloperRepository';
import type { IGitRepository } from '../../../domain/repositories/IGitRepository';
import type { ITeamRepository } from '../../../domain/repositories/ITeamRepository';

export interface Catalog {
  teams: Team[];
  developers: Developer[];
  repositories: Repository[];
}

/** Listas de referencia para filtros y formularios. */
export class GetCatalog {
  constructor(
    private readonly teams: ITeamRepository,
    private readonly developers: IDeveloperRepository,
    private readonly repositories: IGitRepository,
  ) {}

  async execute(): Promise<Catalog> {
    const [teams, developers, repositories] = await Promise.all([
      this.teams.findAll(),
      this.developers.findAll(),
      this.repositories.findAll(),
    ]);
    return { teams, developers, repositories };
  }
}
