// src/context/RoleContext.tsx
"use client";

import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "./authContext";

type Role = "user" | "admin";

interface Permission {
  read: boolean;
  write: boolean;
  delete: boolean;
  admin: boolean;
}

interface RoleContextType {
  role: Role | null;
  permissions: Permission;
  hasPermission: (action: keyof Permission) => boolean;
  isAdmin: boolean;
  isUser: boolean;
  getDashboardRoute: () => string;
  canAccess: (requiredRole: Role) => boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
};

interface RoleProviderProps {
  children: ReactNode;
}

// Configuration des permissions par rôle
const rolePermissions: Record<Role, Permission> = {
  user: {
    read: true,
    write: true,
    delete: false,
    admin: false,
  },
  admin: {
    read: true,
    write: true,
    delete: true,
    admin: true,
  },
};

// Routes des dashboards par rôle
const dashboardRoutes: Record<Role, string> = {
  user: "/user/dashboard",
  admin: "/admin/dashboard",
};

export const RoleProvider = ({ children }: RoleProviderProps) => {
  const { userData, isAuthenticated } = useAuth();
  
  // Correction ici : on utilise userData.userType
  const role = userData?.userType || null;
  const permissions = role ? rolePermissions[role] : rolePermissions.user;
  
  const hasPermission = (action: keyof Permission): boolean => {
    if (!isAuthenticated || !role) return false;
    return permissions[action];
  };

  const isAdmin = role === "admin";
  const isUser = role === "user";

  const getDashboardRoute = (): string => {
    if (!role) return "/auth/connexion";
    return dashboardRoutes[role];
  };

  const canAccess = (requiredRole: Role): boolean => {
    if (!isAuthenticated || !role) return false;
    
    // Admin peut accéder à tout
    if (role === "admin") return true;
    
    // Utilisateur ne peut accéder qu'aux routes utilisateur
    if (role === "user" && requiredRole === "user") return true;
    
    return false;
  };

  const value: RoleContextType = {
    role,
    permissions,
    hasPermission,
    isAdmin,
    isUser,
    getDashboardRoute,
    canAccess,
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};