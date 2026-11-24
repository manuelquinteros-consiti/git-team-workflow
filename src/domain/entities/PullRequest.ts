import type { PipelineStatus } from '../enums/PipelineStatus';
import type { PullRequestStatus } from '../enums/PullRequestStatus';
import type { PullRequestReviewState } from '../enums/ReviewState';

export interface PullRequest {
  id: number;
  title: string;
  developerId: number;
  repositoryId: number;
  /** Fecha local de creación en formato YYYY-MM-DD. */
  date: string;
  /** Hora local de creación (0-23). */
  hour: number;
  status: PullRequestStatus;
  review: PullRequestReviewState;
  pipeline: PipelineStatus;
  source: string;
  target: string;
  files: number;
  additions: number;
  deletions: number;
  comments: number;
}
