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
        <div className="w-8 h-8 border-[3px] border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
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
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}