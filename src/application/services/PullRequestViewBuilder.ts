import type { IDeveloperRepository } from '../../domain/repositories/IDeveloperRepository';
import type { IGitRepository } from '../../domain/repositories/IGitRepository';
import type { IPullRequestRepository } from '../../domain/repositories/IPullRequestRepository';
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository';
import type { PullRequestView } from '../../domain/value-objects/PullRequestView';
import type { SemanticAnalysisService } from './SemanticAnalysisService';

/** Resuelve las relaciones de cada Pull Request y adjunta su análisis semántico. */
export class PullRequestViewBuilder {
  constructor(
    private readonly pullRequests: IPullRequestRepository,
    private readonly developers: IDeveloperRepository,
    private readonly repositories: IGitRepository,
    private readonly teams: ITeamRepository,
    private readonly semantic: SemanticAnalysisService,
  ) {}

  async buildAll(): Promise<PullRequestView[]> {
    const [prs, developers, repositories, teams, strategy] = await Promise.all([
      this.pullRequests.findAll(),
      this.developers.findAll(),
      this.repositories.findAll(),
      this.teams.findAll(),
      this.semantic.getStrategy(),
    ]);
    const developerById = new Map(developers.map((d) => [d.id, d]));
    const repositoryById = new Map(repositories.map((r) => [r.id, r]));
    const teamById = new Map(teams.map((t) => [t.id, t]));

    return prs.map((pr) => {
      const repository = repositoryById.get(pr.repositoryId);
      return {
        pr,
        author: developerById.get(pr.developerId),
        repository,
        team: repository ? teamById.get(repository.teamId) : undefined,
        semantic: strategy.analyze(pr.title),
      };
    });
  }
}
