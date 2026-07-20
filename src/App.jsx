import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './components/Login';
import DashboardPage from './pages/DashboardPage';
import BoothsPage from './pages/BoothsPage';
import TransactionsPage from './pages/TransactionsPage';
import FramesPage from './pages/FramesPage';
import PricingPage from './pages/PricingPage';
import FranchiseesPage from './pages/FranchiseesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show blank screen while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in → show Login
  if (!isAuthenticated) {
    return <Login />;
  }

  // Logged in → show Dashboard with nested routes
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/booths" element={<BoothsPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/frames" element={<FramesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/franchisees" element={<FranchiseesPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <>
      {/* Global Watermark Overlay */}
      <div style={{
        position: 'fixed', 
        inset: '-50%', 
        pointerEvents: 'none', /* Keeps the prototype clickable so they can test it */
        zIndex: 9999, 
        overflow: 'hidden',
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'center',
        alignItems: 'center',
        gap: '70px', /* TIGHTER GAP: Makes it impossible to crop a clean square between words */
        opacity: 0.05, /* BUMPED UP: Visible enough to ruin a screenshot, but not blinding */
        transform: 'rotate(-24deg)', 
        userSelect: 'none',
      }}>
        {Array.from({ length: 250 }).map((_, i) => (
          <span 
            key={i} 
            className="text-xl font-semibold uppercase tracking-[0.2em]"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
              color: 'currentColor', 
            }}
          >
            Prototype
          </span>
        ))}
      </div>

      {/* Main App Content */}
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </>
  );
}