// src/app/auth/connexion.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "@/firebase/auth";

export default function Connexion() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({
    identifier: "", // Peut être email ou ID HD
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Vérifier si l'identifiant est un ID HD (commence par HD)
      const isHDId = credentials.identifier.startsWith("HD");
      
      // Pour la démo, nous supposons que l'identifiant est un email
      // En production, vous devrez vérifier dans votre base de données
      await signInWithEmailAndPassword(
        credentials.identifier + (isHDId ? "" : "@example.com"), // Adaptez selon votre logique
        credentials.password
      );
      
      router.push("/user/dashboard");
    } catch (err) {
      setError("Identifiant ou mot de passe incorrect");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await sendPasswordResetEmail(resetEmail);
      setError("Un lien de réinitialisation a été envoyé à votre email");
      setShowForgotPassword(false);
    } catch (err) {
      setError("Erreur lors de l'envoi du lien de réinitialisation");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-800 p-4">
      <div className="max-w-md w-full p-6 space-y-6 bg-white dark:bg-gray-900 rounded-lg shadow-md">
        <header className="text-center">
          <h1 className="text-2xl font-bold">Connexion</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Accédez à votre espace personnel
          </p>
        </header>

        {error && (
          <div className={`p-3 rounded-md ${
            error.includes("envoyé") 
              ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200"
              : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200"
          }`}>
            {error}
          </div>
        )}

        {!showForgotPassword ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Identifiant HD ou Email
              </label>
              <input
                type="text"
                name="identifier"
                required
                value={credentials.identifier}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="HD123 ou votre@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                name="password"
                required
                value={credentials.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Votre mot de passe"
              />
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
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-blue-400"
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <p className="text-sm">
              Entrez votre email pour recevoir un lien de réinitialisation
            </p>

            <div>
              <label className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                name="resetEmail"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="votre@email.com"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-blue-400"
              >
                {loading ? "Envoi en cours..." : "Envoyer le lien"}
              </button>
            </div>
          </form>
        )}

        <footer className="text-center text-sm">
          Pas encore de compte?{" "}
          <Link href="/auth/inscription" className="text-blue-600 hover:underline">
            Créer un compte
          </Link>
        </footer>
      </div>
    </div>
  );
}