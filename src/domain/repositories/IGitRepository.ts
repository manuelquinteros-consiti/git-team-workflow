import type { Repository } from '../entities/Repository';

export interface IGitRepository {
  findAll(): Promise<Repository[]>;
  findById(id: number): Promise<Repository | undefined>;
  /** Con id 0 crea un registro nuevo y devuelve la entidad con su id asignado. */
  save(repository: Repository): Promise<Repository>;
  remove(id: number): Promise<void>;
}
