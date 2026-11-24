import type { JsonSeeds } from '../../infrastructure/factories/RepositoryFactory';
import developers from '../../data/developers.json';
import pullRequests from '../../data/pullRequests.json';
import repositories from '../../data/repositories.json';
import reviews from '../../data/reviews.json';
import settings from '../../data/settings.json';
import teams from '../../data/teams.json';

/** Datos simulados iniciales. */
export const jsonSeeds: JsonSeeds = {
  teams,
  developers,
  repositories,
  pullRequests,
  reviews,
  settings,
};
