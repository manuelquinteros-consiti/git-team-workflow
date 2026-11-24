import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, Moon, Sun } from 'lucide-react';
import { Toaster } from '../components/common/Toaster';
import { useSettings } from '../hooks/useSettings';
import { PullRequestDrawerHost } from '../modules/pull-requests/PullRequestDrawerHost';
import { useUiStore } from '../store/uiStore';
import { NAVIGATION } from './navigation';

export function AppLayout() {
  const { settings, update } = useSettings();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const { pathname } = useLocation();
  const theme = settings?.theme ?? 'dark';
  const current = NAVIGATION.find((n) =>
    n.to === '/' ? pathname === '/' : pathname.startsWith(n.to),
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.density = settings?.density ?? 'comfortable';
  }, [theme, settings?.density]);

  return (
    <div className={sidebarCollapsed ? 'layout collapsed' : 'layout'}>
      <aside aria-label="Navegación principal">
        <div className="brand">
          <span className="logo">◈</span>
          {!sidebarCollapsed && <strong>Git Team</strong>}
        </div>
        <nav>
          {NAVIGATION.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={label}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <Icon size={16} />
              {!sidebarCollapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
        {!sidebarCollapsed && <footer>● Datos simulados</footer>}
      </aside>
      <div className="content">
        <header className="topbar">
          <button
            type="button"
            className="icon-button"
            aria-label="Alternar menú lateral"
            onClick={toggleSidebar}
          >
            <Menu size={18} />
          </button>
          <small>WORKSPACE / {(current?.label ?? '').toUpperCase()}</small>
          <button
            type="button"
            className="icon-button theme-toggle"
            aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            onClick={() => update({ theme: theme === 'dark' ? 'light' : 'dark' })}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
      <PullRequestDrawerHost />
      <Toaster />
    </div>
  );
}
