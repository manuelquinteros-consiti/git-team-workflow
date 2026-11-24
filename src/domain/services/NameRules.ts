import { ValidationError } from '../errors/DomainError';

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/** Regla de dominio: un nombre es obligatorio y único (sin distinguir mayúsculas) dentro de su colección. */
export function assertValidUniqueName(
  rawName: string,
  existing: ReadonlyArray<{ id: number; name: string }>,
  currentId: number,
  label: string,
): string {
  const name = normalizeName(rawName);
  if (!name) throw new ValidationError(`El nombre de ${label} es obligatorio`);
  const duplicated = existing.some(
    (item) => item.id !== currentId && item.name.toLowerCase() === name.toLowerCase(),
  );
  if (duplicated) throw new ValidationError(`Ya existe ${label} con el nombre "${name}"`);
  return name;
}
