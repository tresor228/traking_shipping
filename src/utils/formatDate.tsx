export function generateUserId(): string {
  const randomNum = Math.floor(100 + Math.random() * 900); //Generation de 3 chiffres aléatoires entre 100 et 999
  return `HD${randomNum}`;
  
}