import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter, Eye, Edit2, Trash2 } from 'lucide-react';

export default function AdminDashboard() {
  const [packages, setPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [transportFilter, setTransportFilter] = useState('all');

  // TODO: Implémenter la récupération des colis depuis Firebase
  useEffect(() => {
    // fetchPackages();
  }, []);

  // TODO: Implémenter la recherche et filtrage
  useEffect(() => {
    // filterPackages();
  }, [searchTerm, statusFilter, transportFilter, packages]);

  const stats = [
    { title: 'Total Colis', value: '247', color: 'bg-blue-500' },
    { title: 'En Transit', value: '89', color: 'bg-yellow-500' },
    { title: 'Livrés', value: '158', color: 'bg-green-500' },
    { title: 'En Attente', value: '12', color: 'bg-red-500' }
  ];

  const mockPackages = [
    {
      id: '1',
      trackingNumber: 'CHN123456789',
      userId: 'HD001',
      origin: 'Shenzhen, Chine',
      destination: 'Lagos, Nigeria',
      status: 'in-transit',
      transportType: 'maritime',
      estimatedDelivery: '2024-08-15',
      currentLocation: 'Port de Cotonou'
    },
    {
      id: '2',
      trackingNumber: 'CHN987654321',
      userId: 'HD002',
      origin: 'Guangzhou, Chine',
      destination: 'Abidjan, Côte d\'Ivoire',
      status: 'customs',
      transportType: 'aerien',
      estimatedDelivery: '2024-07-20',
      currentLocation: 'Douanes Abidjan'
    }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { color: 'bg-gray-100 text-gray-800', text: 'En attente' },
      'in-transit': { color: 'bg-blue-100 text-blue-800', text: 'En transit' },
      'customs': { color: 'bg-yellow-100 text-yellow-800', text: 'Douanes' },
      'delivered': { color: 'bg-green-100 text-green-800', text: 'Livré' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getTransportIcon = (type) => {
    return type === 'maritime' ? '🚢' : '✈️';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
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
                <option value="in-transit">En transit</option>
                <option value="customs">Douanes</option>
                <option value="delivered">Livré</option>
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
                {mockPackages.map((pkg) => (
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
                        {pkg.userId}
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
                        <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                          <Eye size={16} />
                        </button>
                        <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                          <Edit2 size={16} />
                        </button>
                        <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
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