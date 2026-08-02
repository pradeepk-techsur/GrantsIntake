import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './pages/auth/LoginPage';
import { GrantorLayout } from './layouts/GrantorLayout';
import { Dashboard } from './pages/grantor/Dashboard';
import { OpportunitiesIndex } from './pages/grantor/OpportunitiesIndex';
import { OpportunityBuilder } from './pages/grantor/opportunities/OpportunityBuilder';
import { OpportunityListPage } from './pages/applicant/OpportunityListPage';
import { OpportunityDetailPage } from './pages/applicant/OpportunityDetailPage';
import { ApplicantLayout } from './layouts/ApplicantLayout';
import { OrgProfilePage } from './pages/applicant/OrgProfilePage';
import { OrgRolesPage } from './pages/applicant/OrgRolesPage';
import { OrgDocumentsPage } from './pages/applicant/OrgDocumentsPage';
import { PrescreenPage } from './pages/applicant/PrescreenPage';
import { PrescreenResultPage } from './pages/applicant/PrescreenResultPage';
import { WorkspacePage } from './pages/applicant/WorkspacePage';
import { WorkspaceListPage } from './pages/applicant/WorkspaceListPage';
import { WorkspacePreviewPage } from './pages/applicant/WorkspacePreviewPage';
import { QASubmitPage } from './pages/applicant/QASubmitPage';
import { CertifySubmitPage } from './pages/applicant/CertifySubmitPage';
import { SubmissionReceiptPage } from './pages/applicant/SubmissionReceiptPage';
import { QAManagementPage } from './pages/grantor/QAManagementPage';
import { IntakeQueuePage } from './pages/grantor/IntakeQueuePage';
import { IntakeQueueDetailPage } from './pages/grantor/IntakeQueueDetailPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

/**
 * Application router.
 *
 * Routes:
 * / → redirect to /login
 * /login → LoginPage
 * /grantor/* → GrantorLayout (auth guard inside layout redirects to /login if not authenticated)
 * /grantor/dashboard → Dashboard (role-appropriate)
 * /grantor/opportunities → OpportunitiesIndex
 *
 * T-02-05: Unauthenticated users hitting /grantor/* are redirected to /login by GrantorLayout.
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          {/* Applicant-facing opportunity portal — no auth required */}
          <Route path="/opportunities" element={<OpportunityListPage />} />
          <Route path="/opportunities/:slug" element={<OpportunityDetailPage />} />
          {/* Authenticated applicant portal */}
          <Route path="/applicant" element={<ApplicantLayout />}>
            <Route index element={<Navigate to="/applicant/applications" replace />} />
            <Route path="profile" element={<OrgProfilePage />} />
            <Route path="profile/roles" element={<OrgRolesPage />} />
            <Route path="profile/documents" element={<OrgDocumentsPage />} />
            <Route path="applications" element={<WorkspaceListPage />} />
            <Route path="workspaces/:workspaceId" element={<WorkspacePage />} />
            <Route path="workspaces/:workspaceId/preview" element={<WorkspacePreviewPage />} />
            <Route path="workspaces/:workspaceId/certify-submit" element={<CertifySubmitPage />} />
            <Route path="workspaces/:workspaceId/receipt" element={<SubmissionReceiptPage />} />
            <Route path="opportunities/:opportunityId/prescreen" element={<PrescreenPage />} />
            <Route path="opportunities/:opportunityId/prescreen/result" element={<PrescreenResultPage />} />
            <Route path="opportunities/:opportunityId/qa" element={<QASubmitPage />} />
            <Route path="dashboard" element={<div data-testid="applicant-dashboard-placeholder"><h1>My Dashboard</h1><p>Coming soon.</p></div>} />
          </Route>
          <Route path="/grantor" element={<GrantorLayout />}>
            <Route index element={<Navigate to="/grantor/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="opportunities" element={<OpportunitiesIndex />} />
            <Route path="opportunities/new" element={<OpportunitiesIndex />} />
            <Route path="opportunities/:id" element={<OpportunityBuilder />} />
            <Route path="intake-queue" element={<IntakeQueuePage />} />
            <Route path="intake-queue/:entryId" element={<IntakeQueueDetailPage />} />
            <Route path="opportunities/:id/qa" element={<QAManagementPage />} />
            <Route path="qa-inbox" element={<Navigate to="/grantor/opportunities" replace />} />
            <Route path="settings" element={<div><h1>Settings</h1><p>Coming in a future phase.</p></div>} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
