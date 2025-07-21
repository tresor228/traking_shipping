"use client";

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

  console.log('PROTECTED ROUTE - isAuthenticated:', isAuthenticated, 'loading:', loading);

  if (loading) return <div style={{textAlign:'center',marginTop:'2rem'}}>Chargement de la session...</div>;
  if (!isAuthenticated) return <div style={{textAlign:'center',marginTop:'2rem'}}>Redirection...</div>;
  return <>{children}</>;
}