import type { PullRequest } from '../entities/PullRequest';

/** Solo lectura: los Pull Requests provienen de una fuente externa (JSON hoy, GitHub mañana). */
export interface IPullRequestRepository {
  findAll(): Promise<PullRequest[]>;
  findById(id: number): Promise<PullRequest | undefined>;
}
