import { Activity, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useDependencies } from '../../../app/providers/DependenciesProvider';
import type { DeveloperSummary } from '../../../application/use-cases/developers/DeveloperUseCases';
import { Avatar } from '../../components/common/Avatar';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Modal } from '../../components/common/Modal';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States';
import { MemberForm } from '../../components/forms/MemberForm';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useCatalog } from '../../hooks/useCatalog';
import { useActionRunner } from '../../hooks/useNotify';
import { RelatedPullRequests } from '../pull-requests/RelatedPullRequests';

export function DevelopersPage() {
  const { useCases } = useDependencies();
  const run = useActionRunner();
  const { teams } = useCatalog();
  const { data, loading, error } = useAsyncData(
    () => useCases.listDevelopers.execute(),
    [useCases],
  );
  const [editing, setEditing] = useState<DeveloperSummary | 'new' | null>(null);
  const [deleting, setDeleting] = useState<DeveloperSummary | null>(null);
  const [activity, setActivity] = useState<DeveloperSummary | null>(null);

  return (
    <>
      <PageHeader
        title="Desarrolladores"
        description="Registra desarrolladores, asígnalos a equipos y consulta su actividad"
        actions={
          <button type="button" className="primary" onClick={() => setEditing('new')}>
            <Plus size={14} /> Nuevo desarrollador
          </button>
        }
      />
      {error && <ErrorState message={error} />}
      {loading && !data && <LoadingState />}
      {data && data.length === 0 && <EmptyState title="Aún no hay desarrolladores" />}
      {data && data.length > 0 && (
        <section className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Equipo</th>
                <th>PR</th>
                <th>Fusionados</th>
                <th>Cumplimiento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.developer.id}>
                  <td>
                    <span className="inline">
                      <Avatar name={s.developer.name} size={22} /> {s.developer.name}
                    </span>
                  </td>
                  <td>{s.team?.name ?? '—'}</td>
                  <td>{s.metrics.total}</td>
                  <td>{s.metrics.merged}</td>
                  <td>{s.metrics.total ? `${s.metrics.compliance}%` : '—'}</td>
                  <td className="actions">
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Ver actividad de ${s.developer.name}`}
                      title="Ver actividad"
                      onClick={() => setActivity(s)}
                    >
                      <Activity size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Editar ${s.developer.name}`}
                      onClick={() => setEditing(s)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Eliminar ${s.developer.name}`}
                      onClick={() => setDeleting(s)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {editing && (
        <Modal
          title={editing === 'new' ? 'Nuevo desarrollador' : 'Editar desarrollador'}
          onClose={() => setEditing(null)}
        >
          <MemberForm
            nameLabel="Nombre del desarrollador"
            initial={editing === 'new' ? undefined : editing.developer}
            teams={teams}
            onCancel={() => setEditing(null)}
            onSubmit={async (value) => {
              if (await run(() => useCases.saveDeveloper.execute(value), 'Desarrollador guardado'))
                setEditing(null);
            }}
          />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog
          title="Eliminar desarrollador"
          message={`¿Eliminar a «${deleting.developer.name}»?`}
          confirmLabel="Eliminar"
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            await run(
              () => useCases.deleteDeveloper.execute(deleting.developer.id),
              'Desarrollador eliminado',
            );
            setDeleting(null);
          }}
        />
      )}
      {activity && (
        <Modal title={`Actividad de ${activity.developer.name}`} onClose={() => setActivity(null)}>
          <RelatedPullRequests filters={{ developerId: activity.developer.id }} />
        </Modal>
      )}
    </>
  );
}
