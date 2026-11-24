import type { IClock } from '../../application/ports/IClock';
import type { IDataResetter } from '../../application/ports/IDataResetter';
import type { IKeyValueStorage } from '../../application/ports/IKeyValueStorage';
import type { IDeveloperRepository } from '../../domain/repositories/IDeveloperRepository';
import type { IGitRepository } from '../../domain/repositories/IGitRepository';
import type { IPullRequestRepository } from '../../domain/repositories/IPullRequestRepository';
import type { IReviewRepository } from '../../domain/repositories/IReviewRepository';
import type { ISettingsRepository } from '../../domain/repositories/ISettingsRepository';
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository';
import { jsonMappers } from '../mappers/JsonMappers';
import { JsonCollection } from '../repositories/JsonCollection';
import { JsonDeveloperRepository } from '../repositories/JsonDeveloperRepository';
import { JsonGitRepository } from '../repositories/JsonGitRepository';
import { JsonPullRequestRepository } from '../repositories/JsonPullRequestRepository';
import { JsonReviewRepository } from '../repositories/JsonReviewRepository';
import { JsonSettingsRepository } from '../repositories/JsonSettingsRepository';
import { JsonTeamRepository } from '../repositories/JsonTeamRepository';

export interface JsonSeeds {
  teams: unknown;
  developers: unknown;
  repositories: unknown;
  pullRequests: unknown;
  reviews: unknown;
  settings: unknown;
}

/** Fuente de datos soportada. Una futura 'github' añadirá otra rama sin tocar casos de uso. */
export type DataSourceKind = 'json';

export interface RepositorySet {
  teams: ITeamRepository;
  developers: IDeveloperRepository;
  git: IGitRepository;
  pullRequests: IPullRequestRepository;
  reviews: IReviewRepository;
  settings: ISettingsRepository;
  resetter: IDataResetter;
}

export interface RepositoryFactoryOptions {
  kind: DataSourceKind;
  storage: IKeyValueStorage;
  clock: IClock;
  seeds: JsonSeeds;
}

/** Factory Pattern: crea el conjunto de repositorios según la fuente de datos. */
export function createRepositories(options: RepositoryFactoryOptions): RepositorySet {
  switch (options.kind) {
    case 'json':
      return createJsonRepositories(options);
    default:
      throw new Error(`Fuente de datos no soportada: ${String(options.kind)}`);
  }
}

function createJsonRepositories({
  storage,
  clock,
  seeds,
}: RepositoryFactoryOptions): RepositorySet {
  const teams = new JsonCollection(storage, 'teams', () => jsonMappers.teams(seeds.teams));
  const developers = new JsonCollection(storage, 'developers', () =>
    jsonMappers.developers(seeds.developers),
  );
  const repositories = new JsonCollection(storage, 'repositories', () =>
    jsonMappers.repositories(seeds.repositories),
  );
  const pullRequests = new JsonCollection(storage, 'pullRequests', () =>
    jsonMappers.pullRequests(seeds.pullRequests, clock.today()),
  );
  const reviews = new JsonCollection(storage, 'reviews', () => jsonMappers.reviews(seeds.reviews));
  const collections = [teams, developers, repositories, pullRequests, reviews];

  return {
    teams: new JsonTeamRepository(teams),
    developers: new JsonDeveloperRepository(developers),
    git: new JsonGitRepository(repositories),
    pullRequests: new JsonPullRequestRepository(pullRequests),
    reviews: new JsonReviewRepository(reviews),
    settings: new JsonSettingsRepository(storage, jsonMappers.settings(seeds.settings)),
    resetter: {
      resetSimulatedData: async () => collections.forEach((collection) => collection.clear()),
    },
  };
}
