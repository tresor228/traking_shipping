// src/app/auth/connexion.tsx
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

        {errors.general && (
          <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md text-sm">
            {errors.general}
          </div>
        )}

        {resetMessage && (
          <div className="p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-md text-sm">
            {resetMessage}
          </div>
        )}

        {!showForgotPassword ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                ID ou Email
              </label>
              <input
                type="text"
                name="identifier"
                required
                value={credentials.identifier}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.identifier ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="ID ou votre@email.com"
              />
              {errors.identifier && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.identifier}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Mot de passe
              </label>
              <input
                type="password"
                name="password"
                required
                value={credentials.password}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Votre mot de passe"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-blue-600 hover:underline w-full text-left"
            >
              Mot de passe oublié ?
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Entrez votre email pour recevoir un lien de réinitialisation
            </p>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                name="resetEmail"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="votre@email.com"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail("");
                  setErrors({});
                  setResetMessage("");
                }}
                className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={resetLoading}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {resetLoading ? "Envoi en cours..." : "Envoyer le lien"}
              </button>
            </div>
          </form>
        )}

        <footer className="text-center text-sm text-gray-600 dark:text-gray-400">
          Pas encore de compte?{" "}
          <Link href="/auth/inscription" className="text-blue-600 hover:underline">
            Créer un compte
          </Link>
        </footer>
      </div>
    </div>
  );
}