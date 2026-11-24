import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { Team } from '../../../domain/entities/Team';
import { memberFormSchema, type MemberFormValues } from './schemas';

interface Props {
  nameLabel: string;
  initial?: { id: number; name: string; teamId: number };
  teams: Team[];
  onSubmit: (value: { id: number; name: string; teamId: number }) => void | Promise<void>;
  onCancel: () => void;
}

/** Formulario compartido por desarrolladores y repositorios (nombre + equipo). */
export function MemberForm({ nameLabel, initial, teams, onSubmit, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: { name: initial?.name ?? '', teamId: initial ? String(initial.teamId) : '' },
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) =>
        onSubmit({ id: initial?.id ?? 0, name: values.name, teamId: Number(values.teamId) }),
      )}
    >
      <label>
        {nameLabel}
        <input {...register('name')} aria-invalid={!!errors.name} />
        {errors.name && <span className="field-error">{errors.name.message}</span>}
      </label>
      <label>
        Equipo
        <select {...register('teamId')} aria-invalid={!!errors.teamId}>
          <option value="">Selecciona un equipo</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {errors.teamId && <span className="field-error">{errors.teamId.message}</span>}
      </label>
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
