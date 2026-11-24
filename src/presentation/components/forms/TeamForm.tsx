import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Developer } from '../../../domain/entities/Developer';
import type { Repository } from '../../../domain/entities/Repository';
import type { SaveTeamInput } from '../../../application/use-cases/teams/TeamUseCases';
import { teamFormSchema, type TeamFormValues } from './schemas';

interface Props {
  initial?: { id: number; name: string };
  /** Desarrolladores y repositorios que pertenecen a otros equipos y pueden moverse a este. */
  assignableDevelopers: Developer[];
  assignableRepositories: Repository[];
  teamNameOf: (teamId: number) => string;
  onSubmit: (input: SaveTeamInput) => void | Promise<void>;
  onCancel: () => void;
}

function toggle(list: number[], id: number): number[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export function TeamForm({
  initial,
  assignableDevelopers,
  assignableRepositories,
  teamNameOf,
  onSubmit,
  onCancel,
}: Props) {
  const [developerIds, setDeveloperIds] = useState<number[]>([]);
  const [repositoryIds, setRepositoryIds] = useState<number[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: { name: initial?.name ?? '' },
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) =>
        onSubmit({
          id: initial?.id ?? 0,
          name: values.name,
          assignDeveloperIds: developerIds,
          assignRepositoryIds: repositoryIds,
        }),
      )}
    >
      <label>
        Nombre del equipo
        <input {...register('name')} aria-invalid={!!errors.name} />
        {errors.name && <span className="field-error">{errors.name.message}</span>}
      </label>
      <fieldset>
        <legend>Asignar desarrolladores</legend>
        <div className="check-list">
          {assignableDevelopers.map((d) => (
            <label key={d.id} className="checkbox">
              <input
                type="checkbox"
                checked={developerIds.includes(d.id)}
                onChange={() => setDeveloperIds(toggle(developerIds, d.id))}
              />
              {d.name} <small>({teamNameOf(d.teamId)})</small>
            </label>
          ))}
          {assignableDevelopers.length === 0 && (
            <small>No hay desarrolladores en otros equipos.</small>
          )}
        </div>
      </fieldset>
      <fieldset>
        <legend>Asignar repositorios</legend>
        <div className="check-list">
          {assignableRepositories.map((r) => (
            <label key={r.id} className="checkbox">
              <input
                type="checkbox"
                checked={repositoryIds.includes(r.id)}
                onChange={() => setRepositoryIds(toggle(repositoryIds, r.id))}
              />
              {r.name} <small>({teamNameOf(r.teamId)})</small>
            </label>
          ))}
          {assignableRepositories.length === 0 && (
            <small>No hay repositorios en otros equipos.</small>
          )}
        </div>
      </fieldset>
      <div className="form-actions">
        <button type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="primary" disabled={isSubmitting}>
          Guardar
        </button>
      </div>
    </form>
  );
}
