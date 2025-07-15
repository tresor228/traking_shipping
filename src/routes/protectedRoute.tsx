import React, { useEffect } from "react";
import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/connexion");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) return <div>Chargement...</div>;
  if (!isAuthenticated) return null;
  return <>{children}</>;
}
