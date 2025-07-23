import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { requestForToken } from '@/lib/firebase'; // 1. FCM 토큰 요청 함수 import
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react'; // 2. useEffect import
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import CreateRoomPage from './pages/CreateRoomPage';
import DashboardPage from './pages/DashboardPage';
import Index from './pages/Index';
import LoginPage from './pages/LoginPage';
import NotFound from './pages/NotFound';
import RegisterPage from './pages/RegisterPage';
import WorkoutUploadPage from './pages/WorkoutUploadPage';

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

const AppRoutes = () => {
  // 3. useAuth 훅을 사용하여 인증 상태를 가져옵니다.
  const { isAuthenticated } = useAuth();

  // 서비스 워커 등록을 위한 useEffect
  useEffect(() => {
    // 브라우저가 서비스 워커를 지원하는지 확인
    if ('serviceWorker' in navigator) {
      // 페이지 로드가 완료된 후 서비스 워커를 등록하여 초기 로딩을 방해하지 않도록 함
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/firebase-messaging-sw.js')
          .then(registration => {
            console.log('Service Worker registered: ', registration);
          })
          .catch(error => {
            console.log('Service Worker registration failed: ', error);
          });
      });
    }
  }, []); // 빈 배열을 전달하여 이 useEffect가 컴포넌트 마운트 시 한 번만 실행되도록 함 

  // 4. useEffect를 사용하여 컴포넌트가 마운트되거나 isAuthenticated 상태가 변경될 때 실행합니다.
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        console.log('알림 허용이 되어있나요 : ', permission);
        // 사용자가 로그인했고(isAuthenticated), 브라우저 알림 권한이 아직 설정되지 않았을 때('default')만 실행
        if (isAuthenticated && Notification.permission === 'granted') {
          console.log('Requesting FCM token...');
          requestForToken();
        }
        if (permission === 'denied') {
          console.log('알림이 거부됨');
        }
      });
    } else {
      console.log('알림이 되지 않음');
    }
  }, [isAuthenticated]); // isAuthenticated가 변경될 때마다 이 효과를 다시 실행합니다.

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
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
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

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