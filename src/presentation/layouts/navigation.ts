import {
  Activity,
  BarChart3,
  Bell,
  BookOpenCheck,
  Folder,
  GitPullRequest,
  LayoutDashboard,
  Settings,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAVIGATION: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/actividad', label: 'Actividad', icon: Bell },
  { to: '/equipos', label: 'Equipos', icon: Users },
  { to: '/desarrolladores', label: 'Desarrolladores', icon: UserRound },
  { to: '/repositorios', label: 'Repositorios', icon: Folder },
  { to: '/pull-requests', label: 'Pull Requests', icon: GitPullRequest },
  { to: '/analisis-semantico', label: 'Análisis semántico', icon: BookOpenCheck },
  { to: '/code-reviews', label: 'Code Reviews', icon: Activity },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
];
