// src/firebase/auth.ts
import { 
  signInWithEmailAndPassword as firebaseSignIn,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updateProfile,
  User,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

// Interface pour les données utilisateur
export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  userType: 'admin' | 'user';
  trackingId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Connexion utilisateur
export async function signInWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
  try {
    return await firebaseSignIn(auth, email, password);
  } catch (error) {
    console.error('Erreur de connexion:', error);
    throw error;
  }
}

// Inscription utilisateur
export async function createUserAccount(
  email: string, 
  password: string, 
  displayName: string,
  userType: 'admin' | 'user' = 'user'
): Promise<UserCredential> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Mettre à jour le profil
    await updateProfile(user, { displayName });

    // Générer un ID de suivi unique pour les utilisateurs normaux
    const trackingId = userType === 'user' ? generateTrackingId() : '';

    // Sauvegarder les données utilisateur dans Firestore
    const userData: UserData = {
      uid: user.uid,
      email: user.email || '',
      displayName,
      userType,
      trackingId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'users', user.uid), userData);

    return userCredential;
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    throw error;
  }
}

// Déconnexion
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Erreur de déconnexion:', error);
    throw error;
  }
}

// Réinitialisation du mot de passe
export async function sendPasswordResetEmail(email: string): Promise<void> {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Erreur d\'envoi d\'email:', error);
    throw error;
  }
}

// Obtenir les données utilisateur
export async function getUserData(uid: string): Promise<UserData | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error('Erreur de récupération des données utilisateur:', error);
    throw error;
  }
}

// Générer un ID de suivi unique
function generateTrackingId(): string {
  const prefix = 'HD';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

// Vérifier si l'utilisateur est admin
export async function isAdmin(user: User): Promise<boolean> {
  try {
    const userData = await getUserData(user.uid);
    return userData?.userType === 'admin';
  } catch (error) {
    console.error('Erreur de vérification admin:', error);
    return false;
  }
}