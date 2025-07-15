import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Eye, Edit2, Trash2 } from 'lucide-react';
import { getAllPackages, createPackage, deletePackage, updatePackage } from '../../firebase/firestore'; // Ajout de l'import
import { useRef, useEffect as useEffectReact } from 'react';

export default function AdminDashboard() {
  // Harmonisation du type avec Firestore
  type PackageType = {
    id: string;
    trackingNumber: string;
    userTrackingId: string;
    origin: string;
    destination: string;
    status: 'pending' | 'in_transit' | 'customs' | 'delivered' | 'lost';
    transportType: 'maritime' | 'aerien';
    weight?: number;
    dimensions?: { length: number; width: number; height: number };
    description?: string;
    value?: number;
    currency?: string;
    shippingDate?: string;
    estimatedDelivery?: string;
    actualDelivery?: string;
    currentLocation?: string;
    notes?: string;
    createdBy?: string;
  };

  const [packages, setPackages] = useState<PackageType[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<PackageType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [transportFilter, setTransportFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    trackingNumber: '',
    userTrackingId: '',
    origin: '',
    destination: '',
    status: 'pending',
    transportType: 'maritime',
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    description: '',
    value: 0,
    currency: 'USD',
    shippingDate: '',
    estimatedDelivery: '',
    currentLocation: '',
    notes: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  // Fermeture du modal avec Échap
  useEffectReact(() => {
    if (!showModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        setEditId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  // Focus auto sur le premier champ du formulaire
  useEffectReact(() => {
    if (showModal && modalRef.current) {
      const input = modalRef.current.querySelector('input, select, textarea') as HTMLElement;
      if (input) input.focus();
    }
  }, [showModal]);

  // Feedback visuel temporaire (succès/erreur)
  useEffectReact(() => {
    if (formSuccess || formError) {
      const timer = setTimeout(() => {
        setFormSuccess(null);
        setFormError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [formSuccess, formError]);

  // Récupération réelle des colis depuis Firestore
  useEffect(() => {
    setLoading(true);
    getAllPackages()
      .then((data) => {
        // On mappe les dates pour les convertir en string (YYYY-MM-DD)
        const filtered = data
          .filter(pkg => typeof pkg.id === 'string' || typeof pkg.id === 'undefined')
          .map(pkg => ({
            ...pkg,
            id: pkg.id ?? '',
            shippingDate: pkg.shippingDate ? new Date(pkg.shippingDate).toISOString().slice(0, 10) : '',
            estimatedDelivery: pkg.estimatedDelivery ? new Date(pkg.estimatedDelivery).toISOString().slice(0, 10) : '',
            actualDelivery: pkg.actualDelivery ? new Date(pkg.actualDelivery).toISOString().slice(0, 10) : '',
          })) as PackageType[];
        setPackages(filtered);
        setLoading(false);
      })
      .catch((err) => {
        setError('Erreur lors du chargement des colis');
        setLoading(false);
      });
  }, []);

  // Recherche et filtrage
  useEffect(() => {
    let filtered = packages;
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(pkg =>
        pkg.trackingNumber.toLowerCase().includes(term) ||
        (pkg.userTrackingId && pkg.userTrackingId.toLowerCase().includes(term))
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(pkg => pkg.status === statusFilter);
    }
    if (transportFilter !== 'all') {
      filtered = filtered.filter(pkg => pkg.transportType === transportFilter);
    }
    setFilteredPackages(filtered);
  }, [searchTerm, statusFilter, transportFilter, packages]);

  // Gestion du formulaire
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('dimensions.')) {
      const dim = name.split('.')[1];
      setForm((prev) => ({ ...prev, dimensions: { ...prev.dimensions, [dim]: Number(value) } }));
    } else if (name === 'weight' || name === 'value') {
      setForm((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Ouvre le modal en mode édition
  const handleEdit = (pkg: PackageType) => {
    setForm({
      trackingNumber: pkg.trackingNumber,
      userTrackingId: pkg.userTrackingId,
      origin: pkg.origin,
      destination: pkg.destination,
      status: pkg.status,
      transportType: pkg.transportType,
      weight: pkg.weight || 0,
      dimensions: pkg.dimensions || { length: 0, width: 0, height: 0 },
      description: pkg.description || '',
      value: pkg.value || 0,
      currency: pkg.currency || 'USD',
      shippingDate: pkg.shippingDate ? new Date(pkg.shippingDate).toISOString().slice(0,10) : '',
      estimatedDelivery: pkg.estimatedDelivery ? new Date(pkg.estimatedDelivery).toISOString().slice(0,10) : '',
      currentLocation: pkg.currentLocation || '',
      notes: pkg.notes || ''
    });
    setEditId(pkg.id);
    setShowModal(true);
  };

  // Suppression de colis
  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce colis ?')) return;
    setLoading(true);
    try {
      await deletePackage(id);
      // Rafraîchir la liste des colis
      setLoading(true);
      const data = await getAllPackages();
      const filtered = data
        .filter(pkg => typeof pkg.id === 'string' || typeof pkg.id === 'undefined')
        .map(pkg => ({
          ...pkg,
          id: pkg.id ?? '',
          shippingDate: pkg.shippingDate ? new Date(pkg.shippingDate).toISOString().slice(0, 10) : '',
          estimatedDelivery: pkg.estimatedDelivery ? new Date(pkg.estimatedDelivery).toISOString().slice(0, 10) : '',
          actualDelivery: pkg.actualDelivery ? new Date(pkg.actualDelivery).toISOString().slice(0, 10) : '',
        })) as PackageType[];
      setPackages(filtered);
      setLoading(false);
    } catch (err) {
      alert('Erreur lors de la suppression du colis.');
    }
    setLoading(false);
  };

  // Soumission du formulaire (création ou édition)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);
    if (!form.trackingNumber || !form.userTrackingId || !form.origin || !form.destination) {
      setFormError('Veuillez remplir tous les champs obligatoires.');
      setFormLoading(false);
      return;
    }
    try {
      if (editId) {
        // Edition
        await updatePackage(editId, {
          ...form,
          status: form.status as 'pending' | 'in_transit' | 'customs' | 'delivered' | 'lost',
          transportType: form.transportType as 'maritime' | 'aerien',
          shippingDate: new Date(form.shippingDate),
          estimatedDelivery: form.estimatedDelivery ? new Date(form.estimatedDelivery) : undefined,
        });
        setFormSuccess('Colis modifié avec succès !');
      } else {
        // Création
        await createPackage({
          ...form,
          status: form.status as 'pending' | 'in_transit' | 'customs' | 'delivered' | 'lost',
          transportType: form.transportType as 'maritime' | 'aerien',
          shippingDate: new Date(form.shippingDate),
          estimatedDelivery: form.estimatedDelivery ? new Date(form.estimatedDelivery) : undefined,
          createdBy: 'admin',
        });
        setFormSuccess('Colis créé avec succès !');
      }
      setShowModal(false);
      setEditId(null);
      setForm({
        trackingNumber: '', userTrackingId: '', origin: '', destination: '', status: 'pending', transportType: 'maritime', weight: 0, dimensions: { length: 0, width: 0, height: 0 }, description: '', value: 0, currency: 'USD', shippingDate: '', estimatedDelivery: '', currentLocation: '', notes: ''
      });
      // Rafraîchir la liste des colis
      setLoading(true);
      const data = await getAllPackages();
      const filtered = data
        .filter(pkg => typeof pkg.id === 'string' || typeof pkg.id === 'undefined')
        .map(pkg => ({
          ...pkg,
          id: pkg.id ?? '',
          shippingDate: pkg.shippingDate ? new Date(pkg.shippingDate).toISOString().slice(0, 10) : '',
          estimatedDelivery: pkg.estimatedDelivery ? new Date(pkg.estimatedDelivery).toISOString().slice(0, 10) : '',
          actualDelivery: pkg.actualDelivery ? new Date(pkg.actualDelivery).toISOString().slice(0, 10) : '',
        })) as PackageType[];
      setPackages(filtered);
      setLoading(false);
    } catch (err) {
      setFormError(editId ? 'Erreur lors de la modification du colis.' : "Erreur lors de la création du colis.");
    } finally {
      setFormLoading(false);
    }
  };

  const stats = [
    { title: 'Total Colis', value: '247', color: 'bg-blue-500' },
    { title: 'En Transit', value: '89', color: 'bg-yellow-500' },
    { title: 'Livrés', value: '158', color: 'bg-green-500' },
    { title: 'En Attente', value: '12', color: 'bg-red-500' }
  ];

  const getStatusBadge = (status: 'pending' | 'in_transit' | 'customs' | 'delivered' | 'lost') => {
    const statusConfig = {
      'pending': { color: 'bg-gray-100 text-gray-800', text: 'En attente' },
      'in_transit': { color: 'bg-blue-100 text-blue-800', text: 'En transit' },
      'customs': { color: 'bg-yellow-100 text-yellow-800', text: 'Douanes' },
      'delivered': { color: 'bg-green-100 text-green-800', text: 'Livré' },
      'lost': { color: 'bg-red-100 text-red-800', text: 'Perdu' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getTransportIcon = (type: 'maritime' | 'aerien') => {
    return type === 'maritime' ? '🚢' : '✈️';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Loader central */}
      {loading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-20">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow text-center">
            <span className="block text-lg font-bold mb-2">Chargement...</span>
            <div className="loader border-4 border-blue-500 border-t-transparent rounded-full w-8 h-8 animate-spin mx-auto" />
          </div>
        </div>
      )}
      {/* Erreur globale */}
      {error && (
        <div className="max-w-2xl mx-auto mt-4 bg-red-100 text-red-700 p-3 rounded text-center">
          {error}
        </div>
      )}
      {/* Modal de création/édition de colis */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-lg relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => { setShowModal(false); setEditId(null); }}>&times;</button>
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{editId ? 'Modifier le colis' : 'Créer un nouveau colis'}</h2>
            {formError && <div className="mb-2 text-red-600">{formError}</div>}
            {formSuccess && <div className="mb-2 text-green-600">{formSuccess}</div>}
            <form onSubmit={handleFormSubmit} className="space-y-3">
              <input name="trackingNumber" value={form.trackingNumber} onChange={handleFormChange} placeholder="Numéro de suivi *" className="w-full p-2 border rounded" required />
              <input name="userTrackingId" value={form.userTrackingId} onChange={handleFormChange} placeholder="ID utilisateur (trackingId) *" className="w-full p-2 border rounded" required />
              <input name="origin" value={form.origin} onChange={handleFormChange} placeholder="Origine *" className="w-full p-2 border rounded" required />
              <input name="destination" value={form.destination} onChange={handleFormChange} placeholder="Destination *" className="w-full p-2 border rounded" required />
              <select name="status" value={form.status} onChange={handleFormChange} className="w-full p-2 border rounded">
                <option value="pending">En attente</option>
                <option value="in_transit">En transit</option>
                <option value="customs">Douanes</option>
                <option value="delivered">Livré</option>
                <option value="lost">Perdu</option>
              </select>
              <select name="transportType" value={form.transportType} onChange={handleFormChange} className="w-full p-2 border rounded">
                <option value="maritime">Maritime</option>
                <option value="aerien">Aérien</option>
              </select>
              <input name="weight" type="number" value={form.weight} onChange={handleFormChange} placeholder="Poids (kg)" className="w-full p-2 border rounded" />
              <div className="flex gap-2">
                <input name="dimensions.length" type="number" value={form.dimensions.length} onChange={handleFormChange} placeholder="Longueur (cm)" className="w-full p-2 border rounded" />
                <input name="dimensions.width" type="number" value={form.dimensions.width} onChange={handleFormChange} placeholder="Largeur (cm)" className="w-full p-2 border rounded" />
                <input name="dimensions.height" type="number" value={form.dimensions.height} onChange={handleFormChange} placeholder="Hauteur (cm)" className="w-full p-2 border rounded" />
              </div>
              <input name="description" value={form.description} onChange={handleFormChange} placeholder="Description" className="w-full p-2 border rounded" />
              <input name="value" type="number" value={form.value} onChange={handleFormChange} placeholder="Valeur" className="w-full p-2 border rounded" />
              <input name="currency" value={form.currency} onChange={handleFormChange} placeholder="Devise (ex: USD)" className="w-full p-2 border rounded" />
              <input name="shippingDate" type="date" value={form.shippingDate} onChange={handleFormChange} placeholder="Date d'expédition" className="w-full p-2 border rounded" />
              <input name="estimatedDelivery" type="date" value={form.estimatedDelivery} onChange={handleFormChange} placeholder="Date de livraison estimée" className="w-full p-2 border rounded" />
              <input name="currentLocation" value={form.currentLocation} onChange={handleFormChange} placeholder="Localisation actuelle" className="w-full p-2 border rounded" />
              <textarea name="notes" value={form.notes} onChange={handleFormChange} placeholder="Notes" className="w-full p-2 border rounded" />
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded" disabled={formLoading}>{formLoading ? (editId ? 'Modification...' : 'Création...') : (editId ? 'Modifier le colis' : 'Créer le colis')}</button>
            </form>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Tableau de bord Admin
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gérez tous les colis et suivis
              </p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors" onClick={() => setShowModal(true)} disabled={loading || formLoading}>
              <Plus size={16} />
              Nouveau Colis
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Rechercher par numéro de suivi, ID utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="in_transit">En transit</option>
                <option value="customs">Douanes</option>
                <option value="delivered">Livré</option>
                <option value="lost">Perdu</option>
              </select>

              {/* Transport Filter */}
              <select
                value={transportFilter}
                onChange={(e) => setTransportFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Transport</option>
                <option value="maritime">Maritime</option>
                <option value="aerien">Aérien</option>
              </select>
            </div>
          </div>
        </div>

        {/* Packages Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Colis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Trajet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Livraison
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {/* Affichage des colis filtrés */}
                {filteredPackages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getTransportIcon(pkg.transportType)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {pkg.trackingNumber}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {pkg.transportType === 'maritime' ? 'Maritime' : 'Aérien'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {pkg.userTrackingId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {pkg.origin}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        → {pkg.destination}
                      </div>
                      {pkg.currentLocation && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          📍 {pkg.currentLocation}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(pkg.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {pkg.estimatedDelivery}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300" onClick={() => {/* Voir détails */}} disabled={loading || formLoading}>
                          <Eye size={16} />
                        </button>
                        <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300" onClick={() => handleEdit(pkg)} disabled={loading || formLoading}>
                          <Edit2 size={16} />
                        </button>
                        <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" onClick={() => handleDelete(pkg.id)} disabled={loading || formLoading}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}