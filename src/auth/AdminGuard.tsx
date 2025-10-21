import { useEffect, useState } from 'react';
import { fetchCurrentUser, isAuthenticated } from '../lib/directus';
import { ADMIN_ROLE_ID } from '../lib/env';

type AdminGuardProps = {
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

function isRoleObject(role: unknown): role is { id?: string; admin_access?: boolean } {
  return typeof role === 'object' && role !== null;
}

export function AdminGuard({ fallback = null, children }: AdminGuardProps) {
  const [status, setStatus] = useState<'loading' | 'unauthorized' | 'authorized'>('loading');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!isAuthenticated()) {
          if (!mounted) return;
          setStatus('unauthorized');
          return;
        }
        const me = await fetchCurrentUser();
        const role = me?.role;
        const hasAdminFlag = isRoleObject(role) ? Boolean(role.admin_access) : false;
        const matchesAdminRoleId = isRoleObject(role) && ADMIN_ROLE_ID ? role.id === ADMIN_ROLE_ID : false;
        const isAdmin = hasAdminFlag || matchesAdminRoleId;
        if (!mounted) return;
        setStatus(isAdmin ? 'authorized' : 'unauthorized');
      } catch {
        if (!mounted) return;
        setStatus('unauthorized');
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (status === 'loading') return null;
  if (status === 'unauthorized') return <>{fallback}</>;
  return <>{children}</>;
}

export default AdminGuard;
