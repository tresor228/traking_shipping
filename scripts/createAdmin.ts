import { createAdminUser } from '../src/firebase/admin.js';

(async () => {
  try {
    const user = await createAdminUser(
      'bernardalade92@gmail.com',
      'Suivi2025',
      'Bernard Admin'
    );
    console.log('Administrateur créé avec succès :', user.uid);
    process.exit(0);
  } catch (e) {
    console.error('Erreur lors de la création de l\'admin :', e);
    process.exit(1);
  }
})(); 