import { useEffect, useState } from "react";
import { fetchPoliciesGlobals, isAuthenticated } from "../lib/directus";

type AdminGuardProps = {
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export function AdminGuard({ fallback = null, children }: AdminGuardProps) {
  const [status, setStatus] = useState<
    "loading" | "unauthorized" | "authorized"
  >("loading");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!isAuthenticated()) {
          if (!mounted) return;
          setStatus("unauthorized");
          return;
        }
        
        // Fetch policies to check admin access (primary method)
        const policies = await fetchPoliciesGlobals();
        const isAdmin = Boolean(policies.admin_access);
        
        if (!mounted) return;
        setStatus(isAdmin ? "authorized" : "unauthorized");
      } catch {
        if (!mounted) return;
        setStatus("unauthorized");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (status === "loading") return null;
  if (status === "unauthorized") return <>{fallback}</>;
  return <>{children}</>;
}

export default AdminGuard;
