import { z } from 'zod';

export const teamFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(60, 'Máximo 60 caracteres'),
});
export type TeamFormValues = z.infer<typeof teamFormSchema>;

export const memberFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(60, 'Máximo 60 caracteres'),
  teamId: z.string().min(1, 'Selecciona un equipo'),
});
export type MemberFormValues = z.infer<typeof memberFormSchema>;
