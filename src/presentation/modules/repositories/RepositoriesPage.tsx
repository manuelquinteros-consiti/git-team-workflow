import { GitPullRequest, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useDependencies } from '../../../app/providers/DependenciesProvider';
import type { RepositorySummary } from '../../../application/use-cases/repositories/RepositoryUseCases';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Modal } from '../../components/common/Modal';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States';
import { MemberForm } from '../../components/forms/MemberForm';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useCatalog } from '../../hooks/useCatalog';
import { useActionRunner } from '../../hooks/useNotify';
import { RelatedPullRequests } from '../pull-requests/RelatedPullRequests';

export function RepositoriesPage() {
  const { useCases } = useDependencies();
  const run = useActionRunner();
  const { teams } = useCatalog();
  const { data, loading, error } = useAsyncData(
    () => useCases.listRepositories.execute(),
    [useCases],
  );
  const [editing, setEditing] = useState<RepositorySummary | 'new' | null>(null);
  const [deleting, setDeleting] = useState<RepositorySummary | null>(null);
  const [viewing, setViewing] = useState<RepositorySummary | null>(null);

  return (
    <>
      <PageHeader
        title="Repositorios"
        description="Registra repositorios, asócialos a equipos y consulta sus Pull Requests"
        actions={
          <button type="button" className="primary" onClick={() => setEditing('new')}>
            <Plus size={14} /> Nuevo repositorio
          </button>
        }
      />
      {error && <ErrorState message={error} />}
      {loading && !data && <LoadingState />}
      {data && data.length === 0 && <EmptyState title="Aún no hay repositorios" />}
      {data && data.length > 0 && (
        <section className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Repositorio</th>
                <th>Equipo</th>
                <th>PR</th>
                <th>Abiertos</th>
                <th>Cumplimiento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.repository.id}>
                  <td>{s.repository.name}</td>
                  <td>{s.team?.name ?? '—'}</td>
                  <td>{s.metrics.total}</td>
                  <td>{s.metrics.open}</td>
                  <td>{s.metrics.total ? `${s.metrics.compliance}%` : '—'}</td>
                  <td className="actions">
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Ver Pull Requests de ${s.repository.name}`}
                      title="Ver Pull Requests"
                      onClick={() => setViewing(s)}
                    >
                      <GitPullRequest size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Editar ${s.repository.name}`}
                      onClick={() => setEditing(s)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Eliminar ${s.repository.name}`}
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
          title={editing === 'new' ? 'Nuevo repositorio' : 'Editar repositorio'}
          onClose={() => setEditing(null)}
        >
          <MemberForm
            nameLabel="Nombre del repositorio"
            initial={editing === 'new' ? undefined : editing.repository}
            teams={teams}
            onCancel={() => setEditing(null)}
            onSubmit={async (value) => {
              if (await run(() => useCases.saveRepository.execute(value), 'Repositorio guardado'))
                setEditing(null);
            }}
          />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog
          title="Eliminar repositorio"
          message={`¿Eliminar el repositorio «${deleting.repository.name}»?`}
          confirmLabel="Eliminar"
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            await run(
              () => useCases.deleteRepository.execute(deleting.repository.id),
              'Repositorio eliminado',
            );
            setDeleting(null);
          }}
        />
      )}
      {viewing && (
        <Modal
          title={`Pull Requests de ${viewing.repository.name}`}
          onClose={() => setViewing(null)}
        >
          <RelatedPullRequests filters={{ repositoryId: viewing.repository.id }} />
        </Modal>
      )}
    </>
  );
}
