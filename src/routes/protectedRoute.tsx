import React from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Logique de protection d'accès utilisateur à implémenter
  return <>{children}</>;
}
