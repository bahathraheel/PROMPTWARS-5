import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, lazy } from 'react';
import { useAuth } from './contexts/AuthContext';
import LoadingScreen from './components/ui/LoadingScreen';
import ErrorBoundary from './components/ErrorBoundary';

// ─── Lazy-loaded pages ─────────────────────────────────────────────────────────
const LandingPage        = lazy(() => import('./pages/LandingPage'));
const SignInPage         = lazy(() => import('./pages/auth/SignInPage'));
const SignUpPage         = lazy(() => import('./pages/auth/SignUpPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const DashboardPage      = lazy(() => import('./pages/dashboard/DashboardPage'));
const CreateEventPage    = lazy(() => import('./pages/events/CreateEventPage'));
const EventDetailPage    = lazy(() => import('./pages/events/EventDetailPage'));
const AIWorkspacePage    = lazy(() => import('./pages/workspace/AIWorkspacePage'));
const BudgetPage         = lazy(() => import('./pages/budget/BudgetPage'));
const TimelinePage       = lazy(() => import('./pages/timeline/TimelinePage'));
const VendorsPage        = lazy(() => import('./pages/vendors/VendorsPage'));
const GuestsPage         = lazy(() => import('./pages/guests/GuestsPage'));
const ChecklistPage      = lazy(() => import('./pages/checklist/ChecklistPage'));
const ThemeStudioPage    = lazy(() => import('./pages/theme/ThemeStudioPage'));
const ExportPage         = lazy(() => import('./pages/export/ExportPage'));
const NotFoundPage       = lazy(() => import('./pages/NotFoundPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// ─── Route Guards ─────────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, initialized } = useAuth();
  if (!initialized || loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/signin" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, initialized } = useAuth();
  if (!initialized || loading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* ── Public ── */}
            <Route path="/"                  element={<ErrorBoundary><LandingPage /></ErrorBoundary>} />
            <Route path="/signin"            element={<PublicRoute><SignInPage /></PublicRoute>} />
            <Route path="/signup"            element={<PublicRoute><SignUpPage /></PublicRoute>} />
            <Route path="/forgot-password"   element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />

            {/* ── Protected ── */}
            <Route path="/dashboard"                       element={<ProtectedRoute><ErrorBoundary><DashboardPage /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/events/create"                   element={<ProtectedRoute><ErrorBoundary><CreateEventPage /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/events/:eventId"                 element={<ProtectedRoute><ErrorBoundary><EventDetailPage /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/events/:eventId/workspace"       element={<ProtectedRoute><ErrorBoundary><AIWorkspacePage /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/events/:eventId/budget"          element={<ProtectedRoute><ErrorBoundary><BudgetPage /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/events/:eventId/timeline"        element={<ProtectedRoute><ErrorBoundary><TimelinePage /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/events/:eventId/vendors"         element={<ProtectedRoute><ErrorBoundary><VendorsPage /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/events/:eventId/guests"          element={<ProtectedRoute><ErrorBoundary><GuestsPage /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/events/:eventId/checklist"       element={<ProtectedRoute><ErrorBoundary><ChecklistPage /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/events/:eventId/theme"           element={<ProtectedRoute><ErrorBoundary><ThemeStudioPage /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/events/:eventId/export"          element={<ProtectedRoute><ErrorBoundary><ExportPage /></ErrorBoundary></ProtectedRoute>} />

            {/* ── 404 ── */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
