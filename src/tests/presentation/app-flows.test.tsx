import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '../../app/router/routes';
import { renderWithApp } from '../helpers';

const open = (route: string) => renderWithApp(<AppRoutes />, route);

describe('Navegación y módulos', () => {
  it('renderiza el dashboard con métricas dinámicas', async () => {
    open('/');
    expect(await screen.findByText('Cumplimiento semántico')).toBeInTheDocument();
    expect(screen.getByText('Pendientes de revisión')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('alterna el menú lateral colapsable y el tema', async () => {
    open('/');
    await userEvent.click(screen.getByLabelText('Alternar menú lateral'));
    expect(screen.queryByText('Datos simulados')).not.toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Cambiar a tema claro'));
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('light'));
    expect(JSON.parse(window.localStorage.getItem('gtw-settings')!).theme).toBe('light');
  });

  it('lista Pull Requests, filtra de forma combinada y quita filtros', async () => {
    open('/pull-requests');
    expect(await screen.findByText('200 resultados')).toBeInTheDocument();
    expect(screen.getAllByTestId('pr-item')).toHaveLength(10);

    await userEvent.selectOptions(
      screen.getByLabelText('Estado', { selector: 'select' }),
      'Abierto',
    );
    await userEvent.selectOptions(screen.getByLabelText('Semántica'), 'invalid');
    expect(await screen.findByText('Estado: Abierto')).toBeInTheDocument();
    expect(screen.getByText('Semántica inválida')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('200 resultados')).not.toBeInTheDocument());
    const filtered = screen.getByText(/\d+ resultados/).textContent!;

    await userEvent.click(screen.getByLabelText('Quitar filtro Estado: Abierto'));
    await waitFor(() => expect(screen.queryByText('Estado: Abierto')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/\d+ resultados/).textContent).not.toBe(filtered));

    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(await screen.findByText('200 resultados')).toBeInTheDocument();
  });

  it('pagina, agrupa y abre el detalle en un drawer', async () => {
    open('/pull-requests');
    await screen.findByText('200 resultados');
    await userEvent.selectOptions(screen.getByLabelText('Registros por página'), '20');
    await waitFor(() => expect(screen.getAllByTestId('pr-item')).toHaveLength(20));
    await userEvent.selectOptions(screen.getByLabelText('Agrupar por'), 'status');
    const headers = await screen.findAllByRole('button', { expanded: true });
    expect(headers.length).toBeGreaterThan(0);
    await userEvent.click(headers[0]);
    expect(headers[0]).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(screen.getAllByRole('button', { expanded: true })[0]);
    await userEvent.click(screen.getAllByTestId('pr-item')[0].querySelector('.title-button')!);
    const drawer = await screen.findByRole('dialog', { name: 'Detalle del Pull Request' });
    expect(await within(drawer).findByText('Análisis semántico')).toBeInTheDocument();
  });

  it('exporta los resultados filtrados a CSV', async () => {
    const { deps } = open('/pull-requests');
    await screen.findByText('200 resultados');
    await userEvent.click(screen.getByRole('button', { name: /Exportar CSV/ }));
    await waitFor(() => expect(deps.download).toHaveBeenCalled());
    expect(deps.download.mock.calls[0][0]).toBe('pull-requests.csv');
  });

  it('el simulador valida títulos en tiempo real', async () => {
    open('/analisis-semantico');
    const input = await screen.findByLabelText('Título a validar');
    await userEvent.clear(input);
    await userEvent.type(input, 'Update code');
    expect(await screen.findByText('Título inválido')).toBeInTheDocument();
    expect(screen.getAllByText(/no sigue el formato/).length).toBeGreaterThan(0);
    await userEvent.clear(input);
    await userEvent.type(input, 'feat(api)!: change response');
    expect(await screen.findByText('Título válido')).toBeInTheDocument();
  });

  it('crea un equipo desde la interfaz y persiste el cambio', async () => {
    open('/equipos');
    await screen.findByText('Frontend');
    await userEvent.click(screen.getByRole('button', { name: /Nuevo equipo/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Nuevo equipo' });
    await userEvent.type(within(dialog).getByLabelText('Nombre del equipo'), 'Data');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByLabelText('Equipo Data')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem('gtw-teams')!)).toHaveLength(6);
  });

  it('muestra un error cuando se elimina un equipo con miembros', async () => {
    open('/equipos');
    await userEvent.click(await screen.findByLabelText('Eliminar Frontend'));
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Eliminar' }),
    );
    expect(
      await screen.findByText(/tiene desarrolladores o repositorios asignados/),
    ).toBeInTheDocument();
  });

  it.each([
    ['/actividad', 'Línea de tiempo derivada'],
    ['/desarrolladores', 'Registra desarrolladores'],
    ['/repositorios', 'Registra repositorios'],
    ['/code-reviews', 'Revisiones pendientes'],
    ['/reportes', 'Resúmenes por período'],
    ['/configuracion', 'Preferencias de visualización'],
  ])('renderiza %s', async (route, text) => {
    open(route);
    expect(await screen.findByText(new RegExp(text))).toBeInTheDocument();
  });

  it('muestra el estado vacío cuando ningún PR coincide', async () => {
    open('/pull-requests');
    await screen.findByText('200 resultados');
    await userEvent.type(screen.getByPlaceholderText(/Buscar por título/), 'zzzz-no-existe');
    expect(await screen.findByText('No hay Pull Requests con estos filtros')).toBeInTheDocument();
  });
});
