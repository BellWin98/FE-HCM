import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Index from './pages/Index';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import WorkoutUploadPage from './pages/WorkoutUploadPage';
import CreateRoomPage from './pages/CreateRoomPage';
import NotFound from './pages/NotFound';
import JoinedRoomsPage from './pages/JoinedRoomsPage';
import StockPortfolioPage from './pages/StockPortfolioPage';
import MyPage from './pages/MyPage';

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/dashboard" element={
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    } />
    <Route path="/admin/rooms" element={
      <ProtectedRoute>
        <JoinedRoomsPage />
      </ProtectedRoute>
    } />
    <Route path="/workout/upload" element={
      <ProtectedRoute>
        <WorkoutUploadPage />
      </ProtectedRoute>
    } />
    <Route path="/rooms/create" element={
      <ProtectedRoute>
        <CreateRoomPage />
      </ProtectedRoute>
    } />
    <Route path="/stock/portfolio" element={
      <ProtectedRoute>
        <StockPortfolioPage />
      </ProtectedRoute>
    } />
    <Route path="/mypage" element={
      <ProtectedRoute>
        <MyPage />
      </ProtectedRoute>
    } />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;