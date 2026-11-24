import type { Developer } from '../../../domain/entities/Developer';
import type { Team } from '../../../domain/entities/Team';
import {
  NotFoundError,
  ReferentialIntegrityError,
  ValidationError,
} from '../../../domain/errors/DomainError';
import type { IDeveloperRepository } from '../../../domain/repositories/IDeveloperRepository';
import type { IPullRequestRepository } from '../../../domain/repositories/IPullRequestRepository';
import type { ITeamRepository } from '../../../domain/repositories/ITeamRepository';
import { assertValidUniqueName } from '../../../domain/services/NameRules';
import type { PullRequestSummary } from '../../dto/Metrics';
import type { IEventBus } from '../../ports/IEventBus';
import { summarize } from '../../services/MetricsService';
import type { PullRequestViewBuilder } from '../../services/PullRequestViewBuilder';

export interface DeveloperSummary {
  developer: Developer;
  team: Team | undefined;
  metrics: PullRequestSummary;
}

export class ListDevelopers {
  constructor(
    private readonly developers: IDeveloperRepository,
    private readonly teams: ITeamRepository,
    private readonly views: PullRequestViewBuilder,
  ) {}

  async execute(): Promise<DeveloperSummary[]> {
    const [developers, teams, views] = await Promise.all([
      this.developers.findAll(),
      this.teams.findAll(),
      this.views.buildAll(),
    ]);
    return developers.map((developer) => ({
      developer,
      team: teams.find((t) => t.id === developer.teamId),
      metrics: summarize(views.filter((v) => v.pr.developerId === developer.id)),
    }));
  }
}

export class SaveDeveloper {
  constructor(
    private readonly developers: IDeveloperRepository,
    private readonly teams: ITeamRepository,
    private readonly events: IEventBus,
  ) {}

  async execute(input: Developer): Promise<Developer> {
    if (!(await this.teams.findById(input.teamId)))
      throw new ValidationError('Selecciona un equipo válido');
    const name = assertValidUniqueName(
      input.name,
      await this.developers.findAll(),
      input.id,
      'un desarrollador',
    );
    const saved = await this.developers.save({ ...input, name });
    this.events.publish({ type: 'data-changed', entity: 'developer' });
    return saved;
  }
}

export class DeleteDeveloper {
  constructor(
    private readonly developers: IDeveloperRepository,
    private readonly pullRequests: IPullRequestRepository,
    private readonly events: IEventBus,
  ) {}

  async execute(id: number): Promise<void> {
    if (!(await this.developers.findById(id)))
      throw new NotFoundError('El desarrollador no existe');
    if ((await this.pullRequests.findAll()).some((pr) => pr.developerId === id)) {
      throw new ReferentialIntegrityError(
        'El desarrollador tiene Pull Requests asociados y no puede eliminarse',
      );
    }
    await this.developers.remove(id);
    this.events.publish({ type: 'data-changed', entity: 'developer' });
  }
}
