"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateHDId } from "@/utils/generateID";
import { formatFrenchDate } from "@/utils/formatDate";
import { sendVerificationCode, verifyCodeAndCreateUser } from "@/firebase/auth";

export default function Inscription() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Infos, 2: Vérif, 3: MDP, 4: Confirmation
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    verificationCode: "",
    password: "",
    confirmPassword: "",
  });
  const [verificationMethod, setVerificationMethod] = useState<"sms" | "email">("sms");
  const [userData, setUserData] = useState({
    userId: "",
    registrationDate: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await sendVerificationCode(
        verificationMethod === "sms" ? formData.telephone : formData.email,
        verificationMethod
      );
      setStep(2);
    } catch (err) {
      setError("Erreur lors de l'envoi du code");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Vérification du code seulement (sans création de compte)
      await verifyCodeAndCreateUser(
        verificationMethod === "sms" ? formData.telephone : formData.email,
        formData.verificationCode,
        false // Ne pas créer le compte encore
      );
      setStep(3); // Passer à l'étape du mot de passe
    } catch (err) {
      setError("Code de vérification invalide");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      setLoading(false);
      return;
    }

    try {
      // Création finale du compte avec mot de passe
      const userId = generateHDId();
      const registrationDate = formatFrenchDate(new Date());

      await verifyCodeAndCreateUser(
        verificationMethod === "sms" ? formData.telephone : formData.email,
        formData.verificationCode,
        true, // Créer le compte maintenant
        {
          userId,
          ...formData,
          registrationDate,
          role: "user",
        }
      );

      setUserData({ userId, registrationDate });
      setStep(4);
    } catch (err) {
      setError("Erreur lors de la création du compte");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-800 p-4">
      <div className="max-w-md w-full p-6 space-y-6 bg-white dark:bg-gray-900 rounded-lg shadow-md">
        <header className="text-center">
          <h1 className="text-2xl font-bold">
            {step === 1 ? "Création de compte" : 
             step === 2 ? "Vérification" : 
             step === 3 ? "Définir un mot de passe" : "Inscription réussie"}
          </h1>
        </header>

        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSubmitStep1} className="space-y-4">
            {/* ... (mêmes champs que précédemment pour nom, prénom, téléphone, email) ... */}
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="text-center">
              <p>Entrez le code reçu par {verificationMethod === "sms" ? "SMS" : "email"}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Code de vérification</label>
              <input
                type="text"
                name="verificationCode"
                required
                value={formData.verificationCode}
                onChange={handleChange}
                className="w-full input-field"
                placeholder="123456"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? "Vérification..." : "Vérifier le code"}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mot de passe</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full input-field"
                placeholder="Au moins 6 caractères"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Confirmer le mot de passe</label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full input-field"
                placeholder="Retapez votre mot de passe"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 btn-secondary"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary"
              >
                {loading ? "Enregistrement..." : "Finaliser l'inscription"}
              </button>
            </div>
          </form>
        )}

        {step === 4 && (
          <div className="text-center space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
              <svg className="w-12 h-12 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <h2 className="text-xl font-bold mt-2">Compte créé avec succès</h2>
              
              <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-md">
                <p className="font-mono text-lg font-bold">{userData.userId}</p>
                <p className="text-sm mt-1">Votre identifiant unique</p>
              </div>
              
              <p className="text-sm mt-2">
                Date d'inscription : {userData.registrationDate}
              </p>
            </div>

            <button
              onClick={() => router.push("/user/dashboard")}
              className="w-full btn-primary"
            >
              Accéder à votre espace
            </button>
          </div>
        )}

        {step !== 4 && (
          <footer className="text-center text-sm">
            Déjà un compte?{" "}
            <Link href="/auth/connexion" className="text-link">
              Se connecter
            </Link>
          </footer>
        )}
      </div>
    </div>
  );
}