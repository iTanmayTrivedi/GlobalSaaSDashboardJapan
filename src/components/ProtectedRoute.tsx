import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { Navigate } from 'react-router-dom';
import { AppRole } from '@/contexts/OrgContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, authMode } = useAuth();
  const { currentOrg, currentRole, organizations, loading: orgLoading, isSuperAdmin } = useOrg();

  if (loading || orgLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  // In supabase mode, only send to onboarding when the user has NO orgs at all.
  // (If they have orgs but currentOrg hasn't resolved yet, just wait — avoids /dashboard ↔ /onboarding loop.)
  if (authMode === 'supabase' && organizations.length === 0) return <Navigate to="/onboarding" replace />;
  if (authMode === 'demo' && !currentOrg) return <Navigate to="/auth" replace />;

  if (requiredRole) {
    const roleHierarchy: Record<AppRole, number> = {
      member: 0,
      org_admin: 1,
      super_admin: 2,
    };
    const userLevel = currentRole ? roleHierarchy[currentRole] : -1;
    const requiredLevel = roleHierarchy[requiredRole];
    if (userLevel < requiredLevel && !isSuperAdmin) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
