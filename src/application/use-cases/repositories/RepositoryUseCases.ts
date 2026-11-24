import type { Repository } from '../../../domain/entities/Repository';
import type { Team } from '../../../domain/entities/Team';
import {
  NotFoundError,
  ReferentialIntegrityError,
  ValidationError,
} from '../../../domain/errors/DomainError';
import type { IGitRepository } from '../../../domain/repositories/IGitRepository';
import type { IPullRequestRepository } from '../../../domain/repositories/IPullRequestRepository';
import type { ITeamRepository } from '../../../domain/repositories/ITeamRepository';
import { assertValidUniqueName } from '../../../domain/services/NameRules';
import type { PullRequestSummary } from '../../dto/Metrics';
import type { IEventBus } from '../../ports/IEventBus';
import { summarize } from '../../services/MetricsService';
import type { PullRequestViewBuilder } from '../../services/PullRequestViewBuilder';

export interface RepositorySummary {
  repository: Repository;
  team: Team | undefined;
  metrics: PullRequestSummary;
}

export class ListRepositories {
  constructor(
    private readonly repositories: IGitRepository,
    private readonly teams: ITeamRepository,
    private readonly views: PullRequestViewBuilder,
  ) {}

  async execute(): Promise<RepositorySummary[]> {
    const [repositories, teams, views] = await Promise.all([
      this.repositories.findAll(),
      this.teams.findAll(),
      this.views.buildAll(),
    ]);
    return repositories.map((repository) => ({
      repository,
      team: teams.find((t) => t.id === repository.teamId),
      metrics: summarize(views.filter((v) => v.pr.repositoryId === repository.id)),
    }));
  }
}

export class SaveRepository {
  constructor(
    private readonly repositories: IGitRepository,
    private readonly teams: ITeamRepository,
    private readonly events: IEventBus,
  ) {}

  async execute(input: Repository): Promise<Repository> {
    if (!(await this.teams.findById(input.teamId)))
      throw new ValidationError('Selecciona un equipo válido');
    const name = assertValidUniqueName(
      input.name,
      await this.repositories.findAll(),
      input.id,
      'un repositorio',
    );
    const saved = await this.repositories.save({ ...input, name });
    this.events.publish({ type: 'data-changed', entity: 'repository' });
    return saved;
  }
}

export class DeleteRepository {
  constructor(
    private readonly repositories: IGitRepository,
    private readonly pullRequests: IPullRequestRepository,
    private readonly events: IEventBus,
  ) {}

  async execute(id: number): Promise<void> {
    if (!(await this.repositories.findById(id)))
      throw new NotFoundError('El repositorio no existe');
    if ((await this.pullRequests.findAll()).some((pr) => pr.repositoryId === id)) {
      throw new ReferentialIntegrityError(
        'El repositorio tiene Pull Requests asociados y no puede eliminarse',
      );
    }
    await this.repositories.remove(id);
    this.events.publish({ type: 'data-changed', entity: 'repository' });
  }
}
