import type { Developer } from '../entities/Developer';
import type { PullRequest } from '../entities/PullRequest';
import type { Repository } from '../entities/Repository';
import type { Team } from '../entities/Team';
import type { SemanticAnalysis } from './SemanticAnalysis';

/** Pull Request con sus relaciones resueltas. Es la unidad sobre la que operan las especificaciones. */
export interface PullRequestView {
  pr: PullRequest;
  author: Developer | undefined;
  repository: Repository | undefined;
  team: Team | undefined;
  semantic: SemanticAnalysis;
}
