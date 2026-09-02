import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTossAccess } from '@/hooks/useTossAccess';

interface RequireTossAccessProps {
  children: React.ReactNode;
  fallbackTo?: string;
}

/**
 * 토스증권 화면 가드. `RequireRole`과 판정 순서(로딩 → 미인증 → 권한없음)는 같지만,
 * 판정 근거를 role 이 아니라 서버 응답(`useTossAccess`)에서 가져온다.
 */
export const RequireTossAccess = ({
  children,
  fallbackTo = '/dashboard',
}: RequireTossAccessProps) => {
  const { isAuthenticated, loading } = useAuth();
  const { hasAccess, isPending } = useTossAccess();

  if (loading || isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAccess) {
    return <Navigate to={fallbackTo} replace />;
  }

  return <>{children}</>;
};
