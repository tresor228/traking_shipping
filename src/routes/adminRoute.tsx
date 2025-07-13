import React from "react";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  // Logique de protection d'accès admin à implémenter
  return <>{children}</>;
}
