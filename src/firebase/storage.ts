// src/firebase/storage.ts
import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  UploadTask
} from 'firebase/storage';
import { storage } from './firebaseConfig';

// Interface pour les métadonnées de fichier
export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  downloadURL: string;
  uploadedAt: Date;
  packageId?: string;
}

// === FONCTIONS D'UPLOAD ===

// Upload simple d'un fichier
export async function uploadFile(
  file: File,
  path: string,
  metadata?: { [key: string]: string }
): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    const uploadResult = await uploadBytes(storageRef, file, { customMetadata: metadata });
    const downloadURL = await getDownloadURL(uploadResult.ref);
    return downloadURL;
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    throw error;
  }
}

// Upload avec progression
export function uploadFileWithProgress(
  file: File,
  path: string,
  onProgress?: (progress: number) => void,
  metadata?: { [key: string]: string }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file, { customMetadata: metadata });

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        console.error('Erreur lors de l\'upload:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

// === FONCTIONS SPÉCIFIQUES AU PROJET ===

// Upload d'une facture pour un colis
export async function uploadInvoice(
  file: File,
  packageId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const path = `invoices/${packageId}/${Date.now()}_${file.name}`;
  const metadata = {
    packageId,
    fileType: 'invoice',
    uploadedAt: new Date().toISOString()
  };

  if (onProgress) {
    return uploadFileWithProgress(file, path, onProgress, metadata);
  } else {
    return uploadFile(file, path, metadata);
  }
}

// Upload d'une preuve de livraison
export async function uploadDeliveryProof(
  file: File,
  packageId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const path = `delivery-proofs/${packageId}/${Date.now()}_${file.name}`;
  const metadata = {
    packageId,
    fileType: 'delivery-proof',
    uploadedAt: new Date().toISOString()
  };

  if (onProgress) {
    return uploadFileWithProgress(file, path, onProgress, metadata);
  } else {
    return uploadFile(file, path, metadata);
  }
}

// Upload d'une photo de colis
export async function uploadPackagePhoto(
  file: File,
  packageId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const path = `package-photos/${packageId}/${Date.now()}_${file.name}`;
  const metadata = {
    packageId,
    fileType: 'package-photo',
    uploadedAt: new Date().toISOString()
  };

  if (onProgress) {
    return uploadFileWithProgress(file, path, onProgress, metadata);
  } else {
    return uploadFile(file, path, metadata);
  }
}

// === FONCTIONS DE GESTION DES FICHIERS ===

// Obtenir l'URL de téléchargement
export async function getFileDownloadURL(path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'URL:', error);
    throw error;
  }
}

// Supprimer un fichier
export async function deleteFile(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    throw error;
  }
}

// Lister tous les fichiers d'un colis
export async function getPackageFiles(packageId: string): Promise<FileMetadata[]> {
  try {
    const files: FileMetadata[] = [];
    
    // Vérifier dans chaque dossier
    const folders = ['invoices', 'delivery-proofs', 'package-photos'];
    
    for (const folder of folders) {
      const folderRef = ref(storage, `${folder}/${packageId}`);
      
      try {
        const listResult = await listAll(folderRef);
        
        for (const itemRef of listResult.items) {
          const metadata = await getMetadata(itemRef);
          const downloadURL = await getDownloadURL(itemRef);
          
          files.push({
            name: itemRef.name,
            size: metadata.size,
            type: metadata.contentType || 'unknown',
            downloadURL,
            uploadedAt: new Date(metadata.timeCreated),
            packageId
          });
        }
      } catch (error) {
        // Le dossier n'existe pas, on continue
        continue;
      }
    }
    
    return files.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  } catch (error) {
    console.error('Erreur lors de la récupération des fichiers:', error);
    throw error;
  }
}

// === FONCTIONS UTILITAIRES ===

// Valider le type de fichier
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

// Valider la taille du fichier (en MB)
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

// Générer un nom de fichier unique
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  return `${timestamp}_${randomString}.${extension}`;
}

// Constantes pour les validations
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const MAX_FILE_SIZE_MB = 10; // 10MB max par fichier