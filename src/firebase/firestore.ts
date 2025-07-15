// src/firebase/firestore.ts
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  setDoc
} from 'firebase/firestore';
import { db } from './config';

// Interface pour les colis
export interface Package {
  id?: string;
  trackingNumber: string;
  userTrackingId: string;
  origin: string;
  destination: string;
  status: 'pending' | 'in_transit' | 'customs' | 'delivered' | 'lost';
  transportType: 'maritime' | 'aerien';
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  description: string;
  value: number;
  currency: string;
  shippingDate: Date;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  currentLocation?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // UID de l'admin qui a créé le colis
}

// Interface pour l'historique de suivi
export interface TrackingHistory {
  id?: string;
  packageId: string;
  status: string;
  location: string;
  description: string;
  timestamp: Date;
  createdBy: string;
}

// === FONCTIONS POUR LES COLIS ===

// Créer un nouveau colis (Admin)
export async function createPackage(packageData: Omit<Package, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const newPackage = {
      ...packageData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'packages'), newPackage);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création du colis:', error);
    throw error;
  }
}

// Obtenir un colis par ID
export async function getPackageById(packageId: string): Promise<Package | null> {
  try {
    const docRef = doc(db, 'packages', packageId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Package;
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du colis:', error);
    throw error;
  }
}

// Obtenir tous les colis d'un utilisateur
export async function getPackagesByUserTrackingId(userTrackingId: string): Promise<Package[]> {
  try {
    const q = query(
      collection(db, 'packages'),
      where('userTrackingId', '==', userTrackingId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Package));
  } catch (error) {
    console.error('Erreur lors de la récupération des colis:', error);
    throw error;
  }
}

// Obtenir tous les colis (Admin)
export async function getAllPackages(): Promise<Package[]> {
  try {
    const q = query(collection(db, 'packages'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Package));
  } catch (error) {
    console.error('Erreur lors de la récupération des colis:', error);
    throw error;
  }
}

// Rechercher un colis par numéro de suivi
export async function getPackageByTrackingNumber(trackingNumber: string): Promise<Package | null> {
  try {
    const q = query(
      collection(db, 'packages'),
      where('trackingNumber', '==', trackingNumber),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Package;
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la recherche du colis:', error);
    throw error;
  }
}

// Mettre à jour un colis
export async function updatePackage(packageId: string, updates: Partial<Package>): Promise<void> {
  try {
    const docRef = doc(db, 'packages', packageId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du colis:', error);
    throw error;
  }
}

// Supprimer un colis
export async function deletePackage(packageId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'packages', packageId));
  } catch (error) {
    console.error('Erreur lors de la suppression du colis:', error);
    throw error;
  }
}

// === FONCTIONS POUR L'HISTORIQUE DE SUIVI ===

// Ajouter une entrée à l'historique
export async function addTrackingHistory(historyData: Omit<TrackingHistory, 'id' | 'timestamp'>): Promise<string> {
  try {
    const newHistory = {
      ...historyData,
      timestamp: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'trackingHistory'), newHistory);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'historique:', error);
    throw error;
  }
}

// Obtenir l'historique d'un colis
export async function getTrackingHistory(packageId: string): Promise<TrackingHistory[]> {
  try {
    const q = query(
      collection(db, 'trackingHistory'),
      where('packageId', '==', packageId),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrackingHistory));
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    throw error;
  }
}

// === FONCTIONS D'ÉCOUTE EN TEMPS RÉEL ===

// Écouter les changements d'un colis
export function subscribeToPackage(packageId: string, callback: (pkg: Package | null) => void): () => void {
  const docRef = doc(db, 'packages', packageId);
  
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as Package);
    } else {
      callback(null);
    }
  });
}

// Écouter les colis d'un utilisateur
export function subscribeToUserPackages(userTrackingId: string, callback: (packages: Package[]) => void): () => void {
  const q = query(
    collection(db, 'packages'),
    where('userTrackingId', '==', userTrackingId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const packages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Package));
    callback(packages);
  });
}

// === FONCTIONS STATISTIQUES (ADMIN) ===

// Obtenir les statistiques des colis
export async function getPackageStats() {
  try {
    const allPackages = await getAllPackages();
    
    const stats = {
      total: allPackages.length,
      pending: allPackages.filter(p => p.status === 'pending').length,
      inTransit: allPackages.filter(p => p.status === 'in_transit').length,
      delivered: allPackages.filter(p => p.status === 'delivered').length,
      maritime: allPackages.filter(p => p.transportType === 'maritime').length,
      aerien: allPackages.filter(p => p.transportType === 'aerien').length,
    };
    
    return stats;
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques:', error);
    throw error;
  }
}

// === FONCTIONS POUR LES UTILISATEURS ===

/**
 * Recherche un utilisateur par son identifiant HD (trackingId)
 * @param hdId L'identifiant HD (ex: HD001)
 * @returns L'objet utilisateur (contenant au moins l'email) ou null si non trouvé
 */
export async function getUserByHDId(hdId: string): Promise<{ email: string } | null> {
  try {
    const q = query(collection(db, 'users'), where('trackingId', '==', hdId), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const data = userDoc.data();
      return { email: data.email };
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la recherche utilisateur par HDId:', error);
    throw error;
  }
}

/**
 * Crée un document utilisateur dans Firestore avec un userId (HDId) et les infos nécessaires
 * @param uid L'identifiant Firebase Auth de l'utilisateur
 * @param data Les données utilisateur à enregistrer (doit contenir userId, email, nom, prenom, etc.)
 */
export async function createUserDocument(uid: string, data: { trackingId: string; email: string; nom: string; prenom: string; }): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid), data);
  } catch (error) {
    console.error('Erreur lors de la création du document utilisateur:', error);
    throw error;
  }
}