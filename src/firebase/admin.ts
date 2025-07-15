// src/firebase/firebaseAdmin.ts
// Ce fichier est pour l'utilisation côté serveur (Node.js/Next.js API routes)
// Il nécessite le SDK Admin de Firebase

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getMessaging } from 'firebase-admin/messaging';

// Configuration Admin SDK
const adminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
};

// Initialisation de l'app Admin (éviter la réinitialisation)
const adminApp = getApps().length > 0 ? getApps()[0] : initializeApp(adminConfig);

// Services Admin
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
export const adminMessaging = getMessaging(adminApp);

// === FONCTIONS D'AUTHENTIFICATION ADMIN ===

// Vérifier un token Firebase
export async function verifyIdToken(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Erreur de vérification du token:', error);
    throw error;
  }
}

// Créer un utilisateur admin
export async function createAdminUser(email: string, password: string, displayName: string) {
  try {
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    // Définir des claims personnalisés pour l'admin
    await adminAuth.setCustomUserClaims(userRecord.uid, { admin: true });

    // Créer le document utilisateur dans Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName,
      userType: 'admin',
      trackingId: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return userRecord;
  } catch (error) {
    console.error('Erreur lors de la création de l\'admin:', error);
    throw error;
  }
}

// Promouvoir un utilisateur en admin
export async function promoteToAdmin(uid: string) {
  try {
    await adminAuth.setCustomUserClaims(uid, { admin: true });
    
    // Mettre à jour le document utilisateur
    await adminDb.collection('users').doc(uid).update({
      userType: 'admin',
      updatedAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error('Erreur lors de la promotion:', error);
    throw error;
  }
}

// === FONCTIONS DE GESTION DES UTILISATEURS ===

// Obtenir tous les utilisateurs
export async function getAllUsers(maxResults: number = 1000) {
  try {
    const listUsersResult = await adminAuth.listUsers(maxResults);
    return listUsersResult.users;
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    throw error;
  }
}

// Désactiver un utilisateur
export async function disableUser(uid: string) {
  try {
    await adminAuth.updateUser(uid, { disabled: true });
    return true;
  } catch (error) {
    console.error('Erreur lors de la désactivation:', error);
    throw error;
  }
}

// Réactiver un utilisateur
export async function enableUser(uid: string) {
  try {
    await adminAuth.updateUser(uid, { disabled: false });
    return true;
  } catch (error) {
    console.error('Erreur lors de la réactivation:', error);
    throw error;
  }
}

// === FONCTIONS DE NOTIFICATION ===

// Interface pour les notifications
export interface NotificationData {
  title: string;
  body: string;
  data?: { [key: string]: string };
  imageUrl?: string;
}

// Envoyer une notification à un utilisateur spécifique
export async function sendNotificationToUser(
  uid: string,
  notification: NotificationData
) {
  try {
    // Récupérer le token FCM de l'utilisateur depuis Firestore
    const userDoc = await adminDb.collection('users').doc(uid).get();
    
    if (!userDoc.data()?.fcmToken) {
      throw new Error('Token FCM non trouvé pour cet utilisateur');
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl,
      },
      data: notification.data || {},
      token: userDoc.data()?.fcmToken,
    };

    const response = await adminMessaging.send(message);
    return response;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification:', error);
    throw error;
  }
}

// Envoyer une notification à tous les utilisateurs
export async function sendNotificationToAll(notification: NotificationData) {
  try {
    // Récupérer tous les tokens FCM
    const usersSnapshot = await adminDb.collection('users')
      .where('fcmToken', '!=', null)
      .get();

    const tokens: string[] = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.fcmToken) {
        tokens.push(userData.fcmToken);
      }
    });

    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl,
      },
      data: notification.data || {},
      tokens: tokens,
    };

    const response = await adminMessaging.sendEachForMulticast(message);
    return response;
  } catch (error) {
    console.error('Erreur lors de l\'envoi des notifications:', error);
    throw error;
  }
}

// Envoyer une notification de mise à jour de colis
export async function sendPackageUpdateNotification(
  userTrackingId: string,
  packageTrackingNumber: string,
  status: string,
  location?: string
) {
  try {
    // Trouver l'utilisateur par son tracking ID
    const usersSnapshot = await adminDb.collection('users')
      .where('trackingId', '==', userTrackingId)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      throw new Error('Utilisateur non trouvé');
    }

    const userDoc = usersSnapshot.docs[0];
    
    const notification: NotificationData = {
      title: '📦 Mise à jour de votre colis',
      body: `Votre colis ${packageTrackingNumber} est maintenant ${status}${location ? ` à ${location}` : ''}.`,
      data: {
        packageTrackingNumber,
        status,
        location: location || '',
      },
      imageUrl: 'https://example.com/package-update-image.png', // URL d'une image
    };
    return await sendNotificationToUser(userDoc.id, notification);
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification de mise à jour de colis:', error);
    throw error;
  }

}