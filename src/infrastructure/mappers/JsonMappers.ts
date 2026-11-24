import { z } from 'zod';
import type { Developer } from '../../domain/entities/Developer';
import type { PullRequest } from '../../domain/entities/PullRequest';
import type { Repository } from '../../domain/entities/Repository';
import type { Review } from '../../domain/entities/Review';
import type { Settings } from '../../domain/entities/Settings';
import type { Team } from '../../domain/entities/Team';
import { PIPELINE_STATUSES } from '../../domain/enums/PipelineStatus';
import { PULL_REQUEST_STATUSES } from '../../domain/enums/PullRequestStatus';
import { PULL_REQUEST_REVIEW_STATES, REVIEW_STATUSES } from '../../domain/enums/ReviewState';
import { addDays } from '../../shared/utils/dates';

const id = z.number().int().positive();
const teamSchema = z.object({ id, name: z.string().min(1) });
const memberSchema = z.object({ id, name: z.string().min(1), teamId: id });
const pullRequestSchema = z.object({
  id,
  title: z.string(),
  developerId: id,
  repositoryId: id,
  dayOffset: z.number().int().nonnegative(),
  hour: z.number().int().min(0).max(23),
  status: z.enum(PULL_REQUEST_STATUSES),
  review: z.enum(PULL_REQUEST_REVIEW_STATES),
  pipeline: z.enum(PIPELINE_STATUSES),
  source: z.string(),
  target: z.string(),
  files: z.number().int().nonnegative(),
  additions: z.number().int().nonnegative(),
  deletions: z.number().int().nonnegative(),
  comments: z.number().int().nonnegative(),
});
const reviewSchema = z.object({
  id,
  pullRequestId: id,
  reviewerId: id,
  status: z.enum(REVIEW_STATUSES),
  responseHours: z.number().nonnegative().nullable(),
});
const settingsSchema = z.object({
  theme: z.enum(['dark', 'light']),
  density: z.enum(['comfortable', 'compact']),
  showAvatars: z.boolean(),
  pageSize: z.union([z.literal(10), z.literal(20), z.literal(50)]),
  semantic: z.object({
    allowedTypes: z.array(z.string()),
    requireScope: z.boolean(),
    maxTitleLength: z.number().int().positive(),
  }),
});

/** Mapper Pattern: convierte JSON externo (validado) en entidades del dominio. */
export const jsonMappers = {
  teams: (raw: unknown): Team[] => z.array(teamSchema).parse(raw),
  developers: (raw: unknown): Developer[] => z.array(memberSchema).parse(raw),
  repositories: (raw: unknown): Repository[] => z.array(memberSchema).parse(raw),
  reviews: (raw: unknown): Review[] => z.array(reviewSchema).parse(raw),
  settings: (raw: unknown): Settings => settingsSchema.parse(raw),
  /** Las fechas se calculan relativas a `today` (primer inicio de la simulación). */
  pullRequests: (raw: unknown, today: string): PullRequest[] =>
    z
      .array(pullRequestSchema)
      .parse(raw)
      .map(({ dayOffset, ...pr }) => ({ ...pr, date: addDays(today, -dayOffset) })),
};
