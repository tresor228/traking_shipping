import React, { useState, useEffect, useRef } from 'react';
import { getPackagesByUserTrackingId, createPackage, getTrackingHistory, updatePackage, deletePackage } from '../../firebase/firestore';
import { useAuth } from '../../context/authContext'; // On suppose qu'il existe un contexte d'auth

export default function Dashboard() {
  const { user, userData } = useAuth(); // userData doit contenir trackingId
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    trackingNumber: '',
    origin: '',
    destination: '',
    transportType: 'maritime',
    description: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [trackingHistory, setTrackingHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  // Focus auto sur le formulaire
  useEffect(() => {
    if (showModal && modalRef.current) {
      const input = modalRef.current.querySelector('input, select, textarea') as HTMLElement;
      if (input) input.focus();
    }
  }, [showModal]);

  // Feedback visuel temporaire
  useEffect(() => {
    if (formSuccess || formError) {
      const timer = setTimeout(() => {
        setFormSuccess(null);
        setFormError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [formSuccess, formError]);

  // Récupération des colis utilisateur
  useEffect(() => {
    if (!userData || !userData.trackingId) return;
    setLoading(true);
    getPackagesByUserTrackingId(userData.trackingId)
      .then((data) => {
        setPackages(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Erreur lors du chargement des colis');
        setLoading(false);
      });
  }, [userData?.trackingId]);

  // Gestion du formulaire
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Ouvre le modal d'édition
  const handleEdit = (pkg: any) => {
    setForm({
      trackingNumber: pkg.trackingNumber,
      origin: pkg.origin,
      destination: pkg.destination,
      transportType: pkg.transportType,
      description: pkg.description || '',
    });
    setEditId(pkg.id);
    setShowModal(true);
  };

  // Suppression de colis
  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce colis ?')) return;
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      await deletePackage(id);
      setFormSuccess('Colis supprimé avec succès !');
      setLoading(true);
      if (userData && userData.trackingId) {
        const data = await getPackagesByUserTrackingId(userData.trackingId);
        setPackages(data);
      }
      setLoading(false);
    } catch (err) {
      setFormError("Erreur lors de la suppression du colis.");
    } finally {
      setFormLoading(false);
    }
  };

  // Soumission du formulaire (ajout ou édition)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);
    if (!form.trackingNumber || !form.origin || !form.destination) {
      setFormError('Veuillez remplir tous les champs obligatoires.');
      setFormLoading(false);
      return;
    }
    if (!userData || !userData.trackingId) {
      setFormError("Impossible d'ajouter le colis : utilisateur non connecté.");
      setFormLoading(false);
      return;
    }
    try {
      if (editId) {
        // Edition
        await updatePackage(editId, {
          ...form,
          transportType: form.transportType as 'maritime' | 'aerien',
        });
        setFormSuccess('Colis modifié avec succès !');
      } else {
        // Ajout
        await createPackage({
          ...form,
          userTrackingId: userData.trackingId,
          status: 'pending',
          transportType: form.transportType as 'maritime' | 'aerien',
          createdBy: user?.uid || '',
          shippingDate: new Date(),
          value: 0,
          weight: 0,
          dimensions: { length: 0, width: 0, height: 0 },
          currency: 'USD',
        });
        setFormSuccess('Colis ajouté avec succès !');
      }
      setShowModal(false);
      setEditId(null);
      setForm({ trackingNumber: '', origin: '', destination: '', transportType: 'maritime', description: '' });
      setLoading(true);
      const data = await getPackagesByUserTrackingId(userData.trackingId);
      setPackages(data);
      setLoading(false);
    } catch (err) {
      setFormError(editId ? 'Erreur lors de la modification du colis.' : "Erreur lors de l'ajout du colis.");
    } finally {
      setFormLoading(false);
    }
  };

  // Ouvre le modal de détail et charge l'historique
  const handleShowDetails = async (pkg: any) => {
    setSelectedPackage(pkg);
    setHistoryLoading(true);
    setHistoryError(null);
    setTrackingHistory([]);
    try {
      const history = await getTrackingHistory(pkg.id);
      setTrackingHistory(history);
    } catch (err) {
      setHistoryError("Erreur lors du chargement de l'historique.");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Ferme le modal de détail
  const handleCloseDetails = () => {
    setSelectedPackage(null);
    setTrackingHistory([]);
    setHistoryError(null);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Tableau de bord utilisateur</h1>
      {loading && <div>Chargement...</div>}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <button className="bg-blue-600 text-white px-4 py-2 rounded mb-4" onClick={() => setShowModal(true)} disabled={formLoading}>Ajouter un colis</button>
      {/* Modal d'ajout/édition de colis */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div ref={modalRef} className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => { setShowModal(false); setEditId(null); }}>&times;</button>
            <h2 className="text-xl font-bold mb-4">{editId ? 'Modifier le colis' : 'Ajouter un colis'}</h2>
            {formError && <div className="mb-2 text-red-600">{formError}</div>}
            {formSuccess && <div className="mb-2 text-green-600">{formSuccess}</div>}
            <form onSubmit={handleFormSubmit} className="space-y-3">
              <input name="trackingNumber" value={form.trackingNumber} onChange={handleFormChange} placeholder="Numéro de suivi *" className="w-full p-2 border rounded" required />
              <input name="origin" value={form.origin} onChange={handleFormChange} placeholder="Origine *" className="w-full p-2 border rounded" required />
              <input name="destination" value={form.destination} onChange={handleFormChange} placeholder="Destination *" className="w-full p-2 border rounded" required />
              <select name="transportType" value={form.transportType} onChange={handleFormChange} className="w-full p-2 border rounded">
                <option value="maritime">Maritime</option>
                <option value="aerien">Aérien</option>
              </select>
              <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Description" className="w-full p-2 border rounded" />
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded" disabled={formLoading}>{formLoading ? (editId ? 'Modification...' : 'Ajout...') : (editId ? 'Modifier le colis' : 'Ajouter le colis')}</button>
            </form>
          </div>
        </div>
      )}
      {/* Liste des colis */}
      <div className="mt-6">
        {packages.length === 0 && !loading && <div>Aucun colis pour l’instant.</div>}
        <ul className="space-y-4">
          {packages.map((pkg) => (
            <li key={pkg.id} className="bg-white rounded shadow p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold">{pkg.trackingNumber}</div>
                  <div className="text-sm text-gray-500">{pkg.origin} → {pkg.destination}</div>
                  <div className="text-xs mt-1">Statut : <span className="font-semibold">{pkg.status}</span></div>
                  <div className="text-xs text-gray-400">Type : {pkg.transportType === 'maritime' ? 'Maritime' : 'Aérien'}</div>
                  {pkg.description && <div className="text-xs mt-1">{pkg.description}</div>}
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold" onClick={() => handleShowDetails(pkg)}>Voir le suivi</button>
                  {pkg.status === 'pending' && (
                    <>
                      <button className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-semibold" onClick={() => handleEdit(pkg)}>Éditer</button>
                      <button className="bg-red-100 text-red-700 px-3 py-1 rounded text-xs font-semibold" onClick={() => handleDelete(pkg.id)}>Supprimer</button>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {/* Modal de détails colis */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={handleCloseDetails}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Détails du colis</h2>
            <div className="mb-2"><span className="font-semibold">Numéro de suivi :</span> {selectedPackage.trackingNumber}</div>
            <div className="mb-2"><span className="font-semibold">Origine :</span> {selectedPackage.origin}</div>
            <div className="mb-2"><span className="font-semibold">Destination :</span> {selectedPackage.destination}</div>
            <div className="mb-2"><span className="font-semibold">Statut :</span> {selectedPackage.status}</div>
            <div className="mb-2"><span className="font-semibold">Type :</span> {selectedPackage.transportType === 'maritime' ? 'Maritime' : 'Aérien'}</div>
            {selectedPackage.description && <div className="mb-2"><span className="font-semibold">Description :</span> {selectedPackage.description}</div>}
            <div className="mb-2"><span className="font-semibold">Poids :</span> {selectedPackage.weight} kg</div>
            <div className="mb-2"><span className="font-semibold">Dimensions :</span> {selectedPackage.dimensions?.length} x {selectedPackage.dimensions?.width} x {selectedPackage.dimensions?.height} cm</div>
            <div className="mb-2"><span className="font-semibold">Valeur :</span> {selectedPackage.value} {selectedPackage.currency}</div>
            <div className="mb-2"><span className="font-semibold">Date d'expédition :</span> {selectedPackage.shippingDate ? new Date(selectedPackage.shippingDate).toLocaleDateString() : '-'}</div>
            <div className="mb-4"><span className="font-semibold">Livraison estimée :</span> {selectedPackage.estimatedDelivery ? new Date(selectedPackage.estimatedDelivery).toLocaleDateString() : '-'}</div>
            <h3 className="text-lg font-bold mt-4 mb-2">Historique du suivi</h3>
            {historyLoading && <div>Chargement de l'historique...</div>}
            {historyError && <div className="text-red-600 mb-2">{historyError}</div>}
            {trackingHistory.length === 0 && !historyLoading && <div>Aucun événement de suivi pour ce colis.</div>}
            <ul className="space-y-2">
              {trackingHistory.map((h) => (
                <li key={h.id} className="border-l-4 border-blue-500 pl-2">
                  <div className="text-xs text-gray-500">{new Date(h.timestamp).toLocaleString()}</div>
                  <div className="font-semibold">{h.status}</div>
                  <div className="text-xs">{h.location}</div>
                  {h.description && <div className="text-xs text-gray-400">{h.description}</div>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}