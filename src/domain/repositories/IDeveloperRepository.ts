import type { Developer } from '../entities/Developer';

export interface IDeveloperRepository {
  findAll(): Promise<Developer[]>;
  findById(id: number): Promise<Developer | undefined>;
  /** Con id 0 crea un registro nuevo y devuelve la entidad con su id asignado. */
  save(developer: Developer): Promise<Developer>;
  remove(id: number): Promise<void>;
}
