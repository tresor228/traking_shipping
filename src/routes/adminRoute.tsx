import React, { useEffect } from "react";
import { useRole } from "@/context/RoleContext";
import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const { isAdmin } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.replace("/auth/connexion");
    }
  }, [isAuthenticated, isAdmin, loading, router]);

  if (loading) return <div>Chargement...</div>;
  if (!isAuthenticated || !isAdmin) return null;
  return <>{children}</>;
}
