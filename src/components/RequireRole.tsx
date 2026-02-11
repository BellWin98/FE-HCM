import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type Role = 'USER' | 'ADMIN' | 'FAMILY';

interface RequireRoleProps {
  children: React.ReactNode;
  allowedRoles: Role[];
  fallbackTo?: string;
}

/**
 * Role-based route guard. Renders children only when the user is authenticated
 * and has one of the allowed roles. Otherwise redirects to login or fallback.
 */
export const RequireRole = ({
  children,
  allowedRoles,
  fallbackTo = '/dashboard',
}: RequireRoleProps) => {
  const { member, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const hasRole = member?.role && allowedRoles.includes(member.role);
  if (!hasRole) {
    return <Navigate to={fallbackTo} replace />;
  }

  return <>{children}</>;
};
