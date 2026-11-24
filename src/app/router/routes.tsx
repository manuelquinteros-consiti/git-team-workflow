import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../../presentation/layouts/AppLayout';
import { ActivityPage } from '../../presentation/modules/activity/ActivityPage';
import { CodeReviewsPage } from '../../presentation/modules/code-reviews/CodeReviewsPage';
import { DashboardPage } from '../../presentation/modules/dashboard/DashboardPage';
import { DevelopersPage } from '../../presentation/modules/developers/DevelopersPage';
import { PullRequestsPage } from '../../presentation/modules/pull-requests/PullRequestsPage';
import { ReportsPage } from '../../presentation/modules/reports/ReportsPage';
import { RepositoriesPage } from '../../presentation/modules/repositories/RepositoriesPage';
import { SemanticAnalysisPage } from '../../presentation/modules/semantic-analysis/SemanticAnalysisPage';
import { SettingsPage } from '../../presentation/modules/settings/SettingsPage';
import { TeamsPage } from '../../presentation/modules/teams/TeamsPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="actividad" element={<ActivityPage />} />
        <Route path="equipos" element={<TeamsPage />} />
        <Route path="desarrolladores" element={<DevelopersPage />} />
        <Route path="repositorios" element={<RepositoriesPage />} />
        <Route path="pull-requests" element={<PullRequestsPage />} />
        <Route path="analisis-semantico" element={<SemanticAnalysisPage />} />
        <Route path="code-reviews" element={<CodeReviewsPage />} />
        <Route path="reportes" element={<ReportsPage />} />
        <Route path="configuracion" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
