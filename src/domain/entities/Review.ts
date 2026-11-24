import type { ReviewStatus } from '../enums/ReviewState';

export interface Review {
  id: number;
  pullRequestId: number;
  reviewerId: number;
  status: ReviewStatus;
  /** Horas transcurridas hasta responder; null mientras siga pendiente. */
  responseHours: number | null;
}
