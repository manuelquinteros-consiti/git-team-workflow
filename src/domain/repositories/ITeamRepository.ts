import type { Team } from '../entities/Team';

export interface ITeamRepository {
  findAll(): Promise<Team[]>;
  findById(id: number): Promise<Team | undefined>;
  /** Con id 0 crea un registro nuevo y devuelve la entidad con su id asignado. */
  save(team: Team): Promise<Team>;
  remove(id: number): Promise<void>;
}
