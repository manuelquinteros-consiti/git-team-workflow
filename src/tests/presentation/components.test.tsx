import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PullRequestItem } from '../../presentation/modules/pull-requests/PullRequestItem';
import { MemberForm } from '../../presentation/components/forms/MemberForm';
import { TeamForm } from '../../presentation/components/forms/TeamForm';
import { Pagination } from '../../presentation/components/common/Pagination';
import { makeView } from '../helpers';

describe('PullRequestItem', () => {
  it('muestra los datos principales del Pull Request', () => {
    const onOpen = vi.fn();
    render(
      <PullRequestItem
        view={makeView({ id: 42, title: 'feat(auth)!: change api' })}
        onOpen={onOpen}
      />,
    );
    expect(screen.getByRole('button', { name: 'feat(auth)!: change api' })).toBeInTheDocument();
    expect(screen.getByText('#42')).toBeInTheDocument();
    expect(screen.getAllByText('Ana López').length).toBeGreaterThan(0);
    expect(screen.getByText('Breaking')).toBeInTheDocument();
    expect(screen.getByText('auth')).toBeInTheDocument();
    expect(screen.getByText('feat/auth → main')).toBeInTheDocument();
    expect(screen.getByText('+10')).toBeInTheDocument();
    expect(screen.getByText('CI: Exitoso')).toBeInTheDocument();
  });

  it('abre el detalle y señala los títulos inválidos', async () => {
    const onOpen = vi.fn();
    render(<PullRequestItem view={makeView({ id: 7, title: 'Update code' })} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole('button', { name: 'Update code' }));
    expect(onOpen).toHaveBeenCalledWith(7);
    expect(screen.getByTitle(/no sigue el formato/)).toBeInTheDocument();
  });
});

describe('Formularios', () => {
  const teams = [
    { id: 1, name: 'Frontend' },
    { id: 2, name: 'Backend' },
  ];

  it('MemberForm valida campos obligatorios con zod', async () => {
    const onSubmit = vi.fn();
    render(<MemberForm nameLabel="Nombre" teams={teams} onSubmit={onSubmit} onCancel={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('El nombre es obligatorio')).toBeInTheDocument();
    expect(document.querySelectorAll('.field-error')).toHaveLength(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('MemberForm envía los valores normalizados', async () => {
    const onSubmit = vi.fn();
    render(<MemberForm nameLabel="Nombre" teams={teams} onSubmit={onSubmit} onCancel={() => {}} />);
    await userEvent.type(screen.getByLabelText('Nombre'), '  Nuevo  ');
    await userEvent.selectOptions(screen.getByLabelText('Equipo'), '2');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ id: 0, name: 'Nuevo', teamId: 2 }));
  });

  it('TeamForm envía las asignaciones seleccionadas', async () => {
    const onSubmit = vi.fn();
    render(
      <TeamForm
        assignableDevelopers={[{ id: 5, name: 'Carlos', teamId: 2 }]}
        assignableRepositories={[{ id: 3, name: 'backend-api', teamId: 2 }]}
        teamNameOf={() => 'Backend'}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />,
    );
    await userEvent.type(screen.getByLabelText('Nombre del equipo'), 'Data');
    await userEvent.click(screen.getByLabelText(/Carlos/));
    await userEvent.click(screen.getByLabelText(/backend-api/));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        id: 0,
        name: 'Data',
        assignDeveloperIds: [5],
        assignRepositoryIds: [3],
      }),
    );
  });
});

describe('Pagination', () => {
  it('ofrece 10, 20 y 50 registros y navega entre páginas', async () => {
    const onPage = vi.fn();
    const onSize = vi.fn();
    render(
      <Pagination
        page={1}
        pageCount={5}
        pageSize={10}
        total={48}
        onPageChange={onPage}
        onPageSizeChange={onSize}
      />,
    );
    const select = screen.getByLabelText('Registros por página');
    expect(
      within(select)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['10 por página', '20 por página', '50 por página']);
    await userEvent.selectOptions(select, '50');
    expect(onSize).toHaveBeenCalledWith(50);
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(onPage).toHaveBeenCalledWith(2);
    expect(screen.getByText('11–20 de 48')).toBeInTheDocument();
  });
});
