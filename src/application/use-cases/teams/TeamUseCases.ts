import type { Developer } from '../../../domain/entities/Developer';
import type { Repository } from '../../../domain/entities/Repository';
import type { Team } from '../../../domain/entities/Team';
import { NotFoundError, ReferentialIntegrityError } from '../../../domain/errors/DomainError';
import type { IDeveloperRepository } from '../../../domain/repositories/IDeveloperRepository';
import type { IGitRepository } from '../../../domain/repositories/IGitRepository';
import type { ITeamRepository } from '../../../domain/repositories/ITeamRepository';
import { assertValidUniqueName } from '../../../domain/services/NameRules';
import type { PullRequestSummary } from '../../dto/Metrics';
import type { IEventBus } from '../../ports/IEventBus';
import { summarize } from '../../services/MetricsService';
import type { PullRequestViewBuilder } from '../../services/PullRequestViewBuilder';

export interface TeamSummary {
  team: Team;
  developers: Developer[];
  repositories: Repository[];
  metrics: PullRequestSummary;
}

export interface SaveTeamInput {
  id: number;
  name: string;
  /** Desarrolladores que se mueven a este equipo (los miembros actuales se conservan). */
  assignDeveloperIds: number[];
  /** Repositorios que se mueven a este equipo (los actuales se conservan). */
  assignRepositoryIds: number[];
}

export class ListTeams {
  constructor(
    private readonly teams: ITeamRepository,
    private readonly developers: IDeveloperRepository,
    private readonly repositories: IGitRepository,
    private readonly views: PullRequestViewBuilder,
  ) {}

  async execute(): Promise<TeamSummary[]> {
    const [teams, developers, repositories, views] = await Promise.all([
      this.teams.findAll(),
      this.developers.findAll(),
      this.repositories.findAll(),
      this.views.buildAll(),
    ]);
    return teams.map((team) => ({
      team,
      developers: developers.filter((d) => d.teamId === team.id),
      repositories: repositories.filter((r) => r.teamId === team.id),
      metrics: summarize(views.filter((v) => v.team?.id === team.id)),
    }));
  }
}

/** Crea o edita un equipo y le asigna desarrolladores y repositorios de otros equipos. */
export class SaveTeam {
  constructor(
    private readonly teams: ITeamRepository,
    private readonly developers: IDeveloperRepository,
    private readonly repositories: IGitRepository,
    private readonly events: IEventBus,
  ) {}

  async execute(input: SaveTeamInput): Promise<Team> {
    const existing = await this.teams.findAll();
    const name = assertValidUniqueName(input.name, existing, input.id, 'un equipo');
    const saved = await this.teams.save({ id: input.id, name });

    const [developers, repositories] = await Promise.all([
      this.developers.findAll(),
      this.repositories.findAll(),
    ]);
    await Promise.all([
      ...developers
        .filter((d) => input.assignDeveloperIds.includes(d.id) && d.teamId !== saved.id)
        .map((d) => this.developers.save({ ...d, teamId: saved.id })),
      ...repositories
        .filter((r) => input.assignRepositoryIds.includes(r.id) && r.teamId !== saved.id)
        .map((r) => this.repositories.save({ ...r, teamId: saved.id })),
    ]);
    this.events.publish({ type: 'data-changed', entity: 'team' });
    return saved;
  }
}

export class DeleteTeam {
  constructor(
    private readonly teams: ITeamRepository,
    private readonly developers: IDeveloperRepository,
    private readonly repositories: IGitRepository,
    private readonly events: IEventBus,
  ) {}

  async execute(id: number): Promise<void> {
    if (!(await this.teams.findById(id))) throw new NotFoundError('El equipo no existe');
    const [developers, repositories] = await Promise.all([
      this.developers.findAll(),
      this.repositories.findAll(),
    ]);
    if (developers.some((d) => d.teamId === id) || repositories.some((r) => r.teamId === id)) {
      throw new ReferentialIntegrityError(
        'El equipo tiene desarrolladores o repositorios asignados. Reasígnalos antes de eliminarlo.',
      );
    }
    await this.teams.remove(id);
    this.events.publish({ type: 'data-changed', entity: 'team' });
  }
}
