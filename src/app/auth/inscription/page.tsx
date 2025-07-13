// src/app/auth/inscription.tsx
"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { generateUserId } from "@/utils/formatDate";
import { formatDate } from "@/utils/generateID";
import { createUserAccount } from "@/firebase/auth";
import { createUserDocument } from "@/firebase/firestore"; // L'import est correct
import { useAuth } from "@/context/authContext";

interface FormData {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  nom?: string;
  prenom?: string;
  telephone?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

interface UserData {
  userId: string;
  registrationDate: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

// Hook pour débouncer les validations
const useDebounce = (callback: () => void, delay: number) => {
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  const debouncedCallback = useCallback(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const timer = setTimeout(() => {
      callback();
    }, delay);
    
    setDebounceTimer(timer);
  }, [callback, delay, debounceTimer]);
  
  return debouncedCallback;
};

export default function Inscription() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: "",
    color: ""
  });
  const [userData, setUserData] = useState<UserData>({
    userId: "",
    registrationDate: "",
  });
  
  const [formData, setFormData] = useState<FormData>({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/user/dashboard");
    }
  }, [isAuthenticated, router]);

  // Fonction pour calculer la force du mot de passe
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    if (!password) return { score: 0, label: "", color: "" };
    
    let score = 0;
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*(),.?":{}|<>]/.test(password),
      password.length >= 12
    ];
    
    score = checks.filter(Boolean).length;
    
    if (score <= 2) return { score, label: "Faible", color: "bg-red-500" };
    if (score <= 4) return { score, label: "Moyen", color: "bg-yellow-500" };
    return { score, label: "Fort", color: "bg-green-500" };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Calculer la force du mot de passe en temps réel
    if (name === "password") {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom est requis";
    } else if (formData.nom.trim().length < 2) {
      newErrors.nom = "Le nom doit contenir au moins 2 caractères";
    } else if (formData.nom.trim().length > 50) {
      newErrors.nom = "Le nom ne peut pas dépasser 50 caractères";
    }
    
    if (!formData.prenom.trim()) {
      newErrors.prenom = "Le prénom est requis";
    } else if (formData.prenom.trim().length < 2) {
      newErrors.prenom = "Le prénom doit contenir au moins 2 caractères";
    } else if (formData.prenom.trim().length > 50) {
      newErrors.prenom = "Le prénom ne peut pas dépasser 50 caractères";
    }
    
    // Regex améliorée pour les numéros français
    const phoneRegex = /^(?:\+33|0033|0)[1-9](?:[0-9]{8})$/;
    if (!formData.telephone.trim()) {
      newErrors.telephone = "Le téléphone est requis";
    } else if (!phoneRegex.test(formData.telephone.replace(/\s/g, ''))) {
      newErrors.telephone = "Format de téléphone invalide (ex: +33 1 23 45 67 89)";
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }
    
    // Validation renforcée du mot de passe
    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 8) {
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(formData.password)) {
      newErrors.password = "Doit contenir majuscule, minuscule, chiffre et caractère spécial";
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirmation requise";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validation debouncée
  const debouncedValidation = useDebounce(validateForm, 500);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});

    try {
      const userCredential = await createUserAccount(
        formData.email.trim(),
        formData.password,
        formData.nom.trim() + ' ' + formData.prenom.trim(),
        "user"
      );
      
      const userId = generateUserId();
      const registrationDate = formatDate(new Date());
      
      const userDocumentData = {
        userId,
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        telephone: formData.telephone.trim(),
        email: formData.email.trim(),
        registrationDate,
        role: "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await createUserDocument(userCredential.user.uid, userDocumentData);
      
      setUserData({ userId, registrationDate });
      setStep(2);
      
    } catch (error: any) {
      console.error("Erreur d'inscription:", error);
      
      let errorMessage = "Erreur lors de la création du compte";
      
      // Gestion étendue des erreurs Firebase
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "Cette adresse email est déjà utilisée";
          break;
        case "auth/invalid-email":
          errorMessage = "Format d'email invalide";
          break;
        case "auth/weak-password":
          errorMessage = "Mot de passe trop faible";
          break;
        case "auth/network-request-failed":
          errorMessage = "Problème de connexion réseau. Vérifiez votre connexion.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Trop de tentatives. Veuillez réessayer plus tard.";
          break;
        case "auth/operation-not-allowed":
          errorMessage = "L'inscription par email/mot de passe n'est pas activée";
          break;
        case "auth/user-disabled":
          errorMessage = "Ce compte a été désactivé";
          break;
        default:
          errorMessage = `Erreur: ${error.message}`;
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/[^\d+]/g, '');
    
    if (cleaned.startsWith('+33')) {
      return cleaned.replace(/(\+33)(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5 $6');
    } else if (cleaned.startsWith('0033')) {
      return cleaned.replace(/(0033)(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '+33 $2 $3 $4 $5 $6');
    } else if (cleaned.startsWith('0')) {
      return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }
    
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, telephone: formatted }));
    
    if (errors.telephone) {
      setErrors(prev => ({ ...prev, telephone: undefined }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-800 p-4">
      <div className="max-w-md w-full p-6 space-y-6 bg-white dark:bg-gray-900 rounded-lg shadow-md">
        <header className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {step === 1 ? "Création de compte" : "Inscription réussie"}
          </h1>
          {step === 1 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Rejoignez notre communauté
            </p>
          )}
        </header>

        {errors.general && (
          <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md text-sm" role="alert">
            {errors.general}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Nom
                </label>
                <input
                  type="text"
                  name="nom"
                  required
                  maxLength={50}
                  value={formData.nom}
                  onChange={handleChange}
                  aria-describedby={errors.nom ? "nom-error" : undefined}
                  aria-invalid={!!errors.nom}
                  className={`w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.nom ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Votre nom"
                />
                {errors.nom && (
                  <p id="nom-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                    {errors.nom}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Prénom
                </label>
                <input
                  type="text"
                  name="prenom"
                  required
                  maxLength={50}
                  value={formData.prenom}
                  onChange={handleChange}
                  aria-describedby={errors.prenom ? "prenom-error" : undefined}
                  aria-invalid={!!errors.prenom}
                  className={`w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.prenom ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Votre prénom"
                />
                {errors.prenom && (
                  <p id="prenom-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                    {errors.prenom}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Téléphone
              </label>
              <input
                type="tel"
                name="telephone"
                required
                value={formData.telephone}
                onChange={handlePhoneChange}
                aria-describedby={errors.telephone ? "telephone-error" : undefined}
                aria-invalid={!!errors.telephone}
                className={`w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.telephone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="+33 1 23 45 67 89"
              />
              {errors.telephone && (
                <p id="telephone-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.telephone}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                aria-describedby={errors.email ? "email-error" : undefined}
                aria-invalid={!!errors.email}
                className={`w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="votre@email.com"
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  aria-describedby={errors.password ? "password-error" : "password-strength"}
                  aria-invalid={!!errors.password}
                  className={`w-full px-3 py-2 pr-10 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Indicateur de force du mot de passe */}
              {formData.password && (
                <div id="password-strength" className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
              
              {errors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                  aria-invalid={!!errors.confirmPassword}
                  className={`w-full px-3 py-2 pr-10 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={showConfirmPassword ? "Masquer la confirmation" : "Afficher la confirmation"}
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Inscription en cours...
                </span>
              ) : (
                "S'inscrire"
              )}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
              <svg
                className="w-12 h-12 mx-auto text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
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
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Accéder à votre espace
            </button>
          </div>
        )}

        {step === 1 && (
          <footer className="text-center text-sm text-gray-600 dark:text-gray-400">
            Déjà un compte?{" "}
            <Link
              href="/auth/connexion"
              className="text-blue-600 hover:underline"
            >
              Se connecter
            </Link>
          </footer>
        )}
      </div>
    </div>
  );
}