import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './pages/auth/LoginPage';
import { GrantorLayout } from './layouts/GrantorLayout';
import { Dashboard } from './pages/grantor/Dashboard';
import { OpportunitiesIndex } from './pages/grantor/OpportunitiesIndex';

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
          <Route path="/grantor" element={<GrantorLayout />}>
            <Route index element={<Navigate to="/grantor/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="opportunities" element={<OpportunitiesIndex />} />
            <Route path="opportunities/new" element={<OpportunitiesIndex />} />
            <Route path="intake-queue" element={<div><h1>Intake Queue</h1><p>Coming in Phase 6.</p></div>} />
            <Route path="qa-inbox" element={<div><h1>Q&A Inbox</h1><p>Coming in a future phase.</p></div>} />
            <Route path="settings" element={<div><h1>Settings</h1><p>Coming in a future phase.</p></div>} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
