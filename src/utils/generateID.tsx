export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
  
}

export function generateTrackingId() {
  const randomNumber = Math.floor(100 + Math.random() * 900); // nombre entre 100 et 999
  return `HD${randomNumber}`;
}