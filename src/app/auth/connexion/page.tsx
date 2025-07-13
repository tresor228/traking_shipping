// src/app/auth/connexion/page.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "@/firebase/auth";
import { getUserByHDId } from "@/firebase/firestore";
import { useAuth } from "@/context/authContext";
import { useRole } from "@/context/RoleContext";

interface LoginCredentials {
  identifier: string;
  password: string;
}

interface FormErrors {
  identifier?: string;
  password?: string;
  general?: string;
}

export default function Connexion() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { getDashboardRoute } = useRole();
  
  const [credentials, setCredentials] = useState<LoginCredentials>({
    identifier: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  // Redirection si déjà connecté
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push(getDashboardRoute());
    }
  }, [isAuthenticated, authLoading, router, getDashboardRoute]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!credentials.identifier.trim()) {
      newErrors.identifier = "L'identifiant est requis";
    }
    
    if (!credentials.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (credentials.password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isHDId = (identifier: string): boolean => {
    return /^HD\d+$/.test(identifier.trim());
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getEmailFromIdentifier = async (identifier: string): Promise<string> => {
    const trimmedIdentifier = identifier.trim();
    
    if (isHDId(trimmedIdentifier)) {
      // Rechercher l'email associé à l'ID HD dans la base de données
      try {
        const userData = await getUserByHDId(trimmedIdentifier);
        if (!userData) {
          throw new Error("Identifiant HD non trouvé");
        }
        return userData.email;
      } catch (error) {
        throw new Error("Identifiant HD invalide");
      }
    } else if (isValidEmail(trimmedIdentifier)) {
      return trimmedIdentifier;
    } else {
      throw new Error("Format d'identifiant invalide");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    
    // Effacer l'erreur du champ modifié
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});

    try {
      const email = await getEmailFromIdentifier(credentials.identifier);
      
      await signInWithEmailAndPassword(email, credentials.password);
      
      // La redirection sera gérée par l'useEffect
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      
      let errorMessage = "Erreur de connexion";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "Aucun compte trouvé avec cet identifiant";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Mot de passe incorrect";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Format d'email invalide";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "Ce compte a été désactivé";
      } else if (error.message.includes("HD")) {
        errorMessage = error.message;
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail.trim()) {
      setErrors({ general: "L'email est requis" });
      return;
    }
    
    if (!isValidEmail(resetEmail)) {
      setErrors({ general: "Format d'email invalide" });
      return;
    }
    
    setResetLoading(true);
    setErrors({});
    setResetMessage("");

    try {
      await sendPasswordResetEmail(resetEmail);
      setResetMessage("Un lien de réinitialisation a été envoyé à votre email");
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmail("");
        setResetMessage("");
      }, 3000);
    } catch (error: any) {
      console.error("Erreur de réinitialisation:", error);
      
      let errorMessage = "Erreur lors de l'envoi du lien";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "Aucun compte trouvé avec cet email";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Format d'email invalide";
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setResetLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-800 p-4">
      <div className="max-w-md w-full p-6 space-y-6 bg-white dark:bg-gray-900 rounded-lg shadow-md">
        <header className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Connexion
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Accédez à votre espace personnel
          </p>
        </header>
        {/* ...le reste du code du formulaire... */}
      </div>
    </div>
  );
} 