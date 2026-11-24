import { GetPullRequestDetail } from '../application/use-cases/pull-requests/GetPullRequestDetail';
import { AnalyzeTitle } from '../application/use-cases/pull-requests/AnalyzeTitle';
import { GetCatalog } from '../application/use-cases/pull-requests/GetCatalog';
import { QueryPullRequests } from '../application/use-cases/pull-requests/QueryPullRequests';
import { GetDashboardMetrics } from '../application/use-cases/dashboard/GetDashboardMetrics';
import { DeleteTeam, ListTeams, SaveTeam } from '../application/use-cases/teams/TeamUseCases';
import {
  DeleteDeveloper,
  ListDevelopers,
  SaveDeveloper,
} from '../application/use-cases/developers/DeveloperUseCases';
import {
  DeleteRepository,
  ListRepositories,
  SaveRepository,
} from '../application/use-cases/repositories/RepositoryUseCases';
import {
  ExportPullRequests,
  ExportTable,
  GenerateReport,
} from '../application/use-cases/reports/ReportUseCases';
import { GetCodeReviews } from '../application/use-cases/reviews/GetCodeReviews';
import { GetActivityFeed } from '../application/use-cases/activity/GetActivityFeed';
import {
  GetSettings,
  ResetSettings,
  ResetSimulatedData,
  UpdateSettings,
} from '../application/use-cases/settings/SettingsUseCases';
import { PullRequestViewBuilder } from '../application/services/PullRequestViewBuilder';
import { SemanticAnalysisService } from '../application/services/SemanticAnalysisService';
import { ConventionalCommitsStrategy } from '../application/strategies/semantic/ConventionalCommitsStrategy';
import { REPORT_STRATEGIES } from '../application/strategies/report/ReportStrategy';
import { EXPORT_STRATEGIES } from '../application/strategies/export/ExportStrategy';
import type { IClock } from '../application/ports/IClock';
import type { IEventBus } from '../application/ports/IEventBus';
import type { IFileDownloader } from '../application/ports/IFileDownloader';
import { BrowserFileDownloader } from '../infrastructure/adapters/BrowserFileDownloader';
import { InMemoryEventBus } from '../infrastructure/adapters/InMemoryEventBus';
import { SystemClock } from '../infrastructure/adapters/SystemClock';
import { createRepositories } from '../infrastructure/factories/RepositoryFactory';
import { LocalStorageAdapter } from '../infrastructure/storage/LocalStorageAdapter';
import { migrateLegacyStorage } from '../infrastructure/storage/LegacyStorageMigration';
import { jsonSeeds } from './config/seeds';

export interface DependencyOptions {
  /** Backend Web Storage; por defecto window.localStorage. */
  storageBackend?: Storage;
  clock?: IClock;
  downloader?: IFileDownloader;
}

/** Composition Root: único lugar donde se instancian implementaciones concretas. */
export function createDependencies(options: DependencyOptions = {}) {
  const storage = new LocalStorageAdapter(options.storageBackend ?? window.localStorage);
  const clock = options.clock ?? new SystemClock();
  const downloader = options.downloader ?? new BrowserFileDownloader();
  const eventBus: IEventBus = new InMemoryEventBus();

  migrateLegacyStorage(storage);
  const repos = createRepositories({ kind: 'json', storage, clock, seeds: jsonSeeds });

  const semantic = new SemanticAnalysisService(
    repos.settings,
    (o) => new ConventionalCommitsStrategy(o),
  );
  const views = new PullRequestViewBuilder(
    repos.pullRequests,
    repos.developers,
    repos.git,
    repos.teams,
    semantic,
  );
  const exportTable = new ExportTable(downloader, EXPORT_STRATEGIES);

  return {
    eventBus,
    clock,
    useCases: {
      getCatalog: new GetCatalog(repos.teams, repos.developers, repos.git),
      queryPullRequests: new QueryPullRequests(views),
      getPullRequestDetail: new GetPullRequestDetail(views, repos.reviews, repos.developers),
      analyzeTitle: new AnalyzeTitle(semantic),
      getDashboardMetrics: new GetDashboardMetrics(views, clock),
      listTeams: new ListTeams(repos.teams, repos.developers, repos.git, views),
      saveTeam: new SaveTeam(repos.teams, repos.developers, repos.git, eventBus),
      deleteTeam: new DeleteTeam(repos.teams, repos.developers, repos.git, eventBus),
      listDevelopers: new ListDevelopers(repos.developers, repos.teams, views),
      saveDeveloper: new SaveDeveloper(repos.developers, repos.teams, eventBus),
      deleteDeveloper: new DeleteDeveloper(repos.developers, repos.pullRequests, eventBus),
      listRepositories: new ListRepositories(repos.git, repos.teams, views),
      saveRepository: new SaveRepository(repos.git, repos.teams, eventBus),
      deleteRepository: new DeleteRepository(repos.git, repos.pullRequests, eventBus),
      getCodeReviews: new GetCodeReviews(repos.reviews, repos.developers, views),
      getActivityFeed: new GetActivityFeed(views),
      generateReport: new GenerateReport(views, REPORT_STRATEGIES),
      exportTable,
      exportPullRequests: new ExportPullRequests(exportTable),
      getSettings: new GetSettings(repos.settings),
      updateSettings: new UpdateSettings(repos.settings, eventBus),
      resetSettings: new ResetSettings(repos.settings, eventBus),
      resetSimulatedData: new ResetSimulatedData(repos.resetter, eventBus),
    },
  };
}

export type Dependencies = ReturnType<typeof createDependencies>;
export type UseCases = Dependencies['useCases'];
