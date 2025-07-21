// src/app/auth/connexion/page.tsx
"use client";

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
  const { isAuthenticated, loading: authLoading, refreshUserData } = useAuth();
  const { getDashboardRoute } = useRole();
  
  const [credentials, setCredentials] = useState<LoginCredentials>({
    identifier: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [resetEmail, setResetEmail] = useState("");

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
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new Error("Identifiant HD invalide: " + error.message);
        }
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
    
    try {
      const email = await getEmailFromIdentifier(credentials.identifier);
      await signInWithEmailAndPassword(email, credentials.password);
      
      // Après connexion, on force la mise à jour du contexte utilisateur
      if (typeof refreshUserData === 'function') {
        await refreshUserData();
      }
      router.push(getDashboardRoute());
    } catch (error: unknown) {
      console.error("Erreur de connexion:", error);
      
      let errorMessage = "Erreur de connexion";
      
      if (error instanceof Error) {
        if (error.message.includes("HD")) {
          errorMessage = error.message;
        } else if (typeof ((error as unknown) as { code?: string }).code === 'string') {
          const code = ((error as unknown) as { code: string }).code;
          if (code === "auth/user-not-found") {
            errorMessage = "Aucun compte trouvé avec cet identifiant";
          } else if (code === "auth/wrong-password") {
            errorMessage = "Mot de passe incorrect";
          } else if (code === "auth/user-disabled") {
            errorMessage = "Ce compte a été désactivé";
          } else if (code === "auth/invalid-credential") {
            errorMessage = "Identifiants invalides. Vérifiez l'email ou le mot de passe.";
          }
        }
      }
      
      setErrors({ general: errorMessage });
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
    
    try {
      await sendPasswordResetEmail(resetEmail);
      alert("Un lien de réinitialisation a été envoyé à votre email");
      setTimeout(() => {
        setResetEmail("");
      }, 3000);
    } catch (error: unknown) {
      console.error("Erreur de réinitialisation:", error);
      
      let errorMessage = "Erreur lors de l'envoi du lien";
      
      if (error instanceof Error) {
        if (typeof ((error as unknown) as { code?: string }).code === 'string') {
          const code = ((error as unknown) as { code: string }).code;
          if (code === "auth/user-not-found") {
            errorMessage = "Aucun compte trouvé avec cet email";
          } else if (code === "auth/invalid-email") {
            errorMessage = "Format d'email invalide";
          }
        }
      }
      
      setErrors({ general: errorMessage });
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
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Identifiant
            </label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              value={credentials.identifier}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="HD12345 ou email@example.com"
            />
            {errors.identifier && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.identifier}</p>}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
            {errors.general && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.general}</p>}
          </div>
          <button
            type="submit"
            disabled={authLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            {authLoading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <div className="text-center">
          <button
            onClick={() => setResetEmail("")}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Mot de passe oublié ?
          </button>
        </div>
        {resetEmail && (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email de réinitialisation
              </label>
              <input
                type="email"
                id="resetEmail"
                name="resetEmail"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Entrez votre email"
              />
              {errors.general && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.general}</p>}
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-700 dark:hover:bg-red-800"
            >
              {authLoading ? "Envoi..." : "Envoyer le lien de réinitialisation"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
} 