// src/firebase/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';

// Configuration Firebase - remplacez par vos propres clés
const firebaseConfig = {
  apiKey: "votre-api-key",
  authDomain: "votre-project.firebaseapp.com",
  projectId: "votre-project-id",
  storageBucket: "votre-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "votre-app-id"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// Services Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);

export default app;