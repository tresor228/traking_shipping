import React, { useState } from 'react';

export default function UploadPage() {
  const [form, setForm] = useState({
    trackingNumber: '',
    userId: '',
    origin: '',
    destination: '',
    transportType: 'maritime',
    estimatedDelivery: '',
    status: 'pending',
    file: null as File | null,
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setForm((prev) => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);
    // Validation simple
    if (!form.trackingNumber || !form.userId || !form.origin || !form.destination || !form.estimatedDelivery) {
      setError('Veuillez remplir tous les champs obligatoires.');
      setLoading(false);
      return;
    }
    // Ici, vous pouvez ajouter l'envoi vers Firebase ou autre backend
    setTimeout(() => {
      setSuccess('Colis ajouté avec succès !');
      setLoading(false);
      setForm({
        trackingNumber: '',
        userId: '',
        origin: '',
        destination: '',
        transportType: 'maritime',
        estimatedDelivery: '',
        status: 'pending',
        file: null,
      });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Ajouter un nouveau colis</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Numéro de suivi *</label>
            <input
              type="text"
              name="trackingNumber"
              value={form.trackingNumber}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ID Utilisateur *</label>
            <input
              type="text"
              name="userId"
              value={form.userId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Origine *</label>
              <input
                type="text"
                name="origin"
                value={form.origin}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Destination *</label>
              <input
                type="text"
                name="destination"
                value={form.destination}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type de transport</label>
              <select
                name="transportType"
                value={form.transportType}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="maritime">Maritime</option>
                <option value="aerien">Aérien</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="pending">En attente</option>
                <option value="in-transit">En transit</option>
                <option value="customs">Douanes</option>
                <option value="delivered">Livré</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date estimée de livraison *</label>
            <input
              type="date"
              name="estimatedDelivery"
              value={form.estimatedDelivery}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fichier (optionnel)</label>
            <input
              type="file"
              name="file"
              onChange={handleFileChange}
              className="mt-1 block w-full text-gray-700 dark:text-gray-300"
              accept="image/*,application/pdf"
            />
          </div>
          {error && <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>}
          {success && <div className="text-green-600 dark:text-green-400 text-sm">{success}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? 'Ajout en cours...' : 'Ajouter le colis'}
          </button>
        </form>
      </div>
    </div>
  );
}