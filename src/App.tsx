/**
 * Root router. Routes a small set of authenticated screens behind a
 * RequireAuth guard, plus the public /login screen.
 */
import { type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { AppShell } from "./components/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PendingPage } from "./pages/PendingPage";
import { RequestDetailPage } from "./pages/RequestDetailPage";
import { HistoryPage } from "./pages/HistoryPage";


function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="text-sm text-ink-400">Loading…</div>
      </div>
    );
  }
  if (!user) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="/pending" element={<PendingPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/requests/:id" element={<RequestDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
