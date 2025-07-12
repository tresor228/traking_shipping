// src/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // TODO: Ajouter ta configuration Firebase ici
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);

// Services Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;

// Types pour la base de données
export interface Package {
  id: string;
  trackingNumber: string;
  userId: string; // ID utilisateur propriétaire
  origin: string;
  destination: string;
  status: 'pending' | 'in-transit' | 'customs' | 'delivered';
  transportType: 'maritime' | 'aerien';
  estimatedDelivery: string;
  currentLocation?: string;
  weight?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  userId: string; // HD ID unique
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  role: 'user' | 'admin';
  registrationDate: string;
  createdAt: string;
  updatedAt: string;
}