import React, { useState, useEffect } from 'react';
import { Property, PropertyType, Operator, Territory, Market } from './types';
import { api } from './services/api';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { PropertyForm } from './components/PropertyForm';
import { PropertyDetailModal } from './components/PropertyDetailModal';
import { OperatorsAdminModal } from './components/OperatorsAdminModal';
import { SyncLogsModal } from './components/SyncLogsModal';
import { SqlSchemaModal } from './components/SqlSchemaModal';
import { GeocodeCacheModal } from './components/GeocodeCacheModal';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [operator, setOperator] = useState<Operator | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // App Data State
  const [properties, setProperties] = useState<Property[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Navigation View
  const [currentView, setCurrentView] = useState<'dashboard' | 'form'>('dashboard');
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [defaultNewType, setDefaultNewType] = useState<PropertyType>('immobili');

  // Modals
  const [viewingProperty, setViewingProperty] = useState<Property | null>(null);
  const [showOperatorsAdmin, setShowOperatorsAdmin] = useState(false);
  const [showSyncLogs, setShowSyncLogs] = useState(false);
  const [showSqlSchema, setShowSqlSchema] = useState(false);
  const [showGeocodeCache, setShowGeocodeCache] = useState(false);

  // Syncing state
  const [isSyncingId, setIsSyncingId] = useState<number | null>(null);
  const [bannerNotice, setBannerNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-login verify
  useEffect(() => {
    checkCurrentAuth();
  }, []);

  const checkCurrentAuth = async () => {
    const token = localStorage.getItem('nexus_token');
    if (!token) {
      setLoadingAuth(false);
      return;
    }
    try {
      const res = await api.getMe();
      setOperator(res.operator);
      loadInitialData();
    } catch (e) {
      localStorage.removeItem('nexus_token');
    } finally {
      setLoadingAuth(false);
    }
  };

  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      const [propsRes, terrRes, mktRes] = await Promise.all([
        api.getProperties(),
        api.getTerritories(),
        api.getMarkets()
      ]);
      setProperties(propsRes.properties);
      setTerritories(terrRes.territories);
      setMarkets(mktRes.markets);
    } catch (err: any) {
      setBannerNotice({
        type: 'error',
        message: `Errore caricamento dati: ${err.message}`
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleLoginSuccess = (op: Operator) => {
    setOperator(op);
    loadInitialData();
  };

  const handleLogout = () => {
    api.logout();
    setOperator(null);
    setCurrentView('dashboard');
    setEditingProperty(null);
  };

  // Property Actions
  const handleNewProperty = (type: PropertyType) => {
    setDefaultNewType(type);
    setEditingProperty(null);
    setCurrentView('form');
  };

  const handleEditProperty = (prop: Property) => {
    setEditingProperty(prop);
    setCurrentView('form');
  };

  const handleSavePropertySuccess = (savedProp: Property) => {
    const existingIndex = properties.findIndex(p => p.id === savedProp.id);
    if (existingIndex >= 0) {
      const updated = [...properties];
      updated[existingIndex] = savedProp;
      setProperties(updated);
    } else {
      setProperties([savedProp, ...properties]);
    }
    setBannerNotice({
      type: 'success',
      message: `Immobile ${savedProp.property_id} salvato correttamente.`
    });
  };

  const handleDeleteProperty = async (id: number) => {
    try {
      await api.deleteProperty(id);
      setProperties(properties.filter(p => p.id !== id));
      setBannerNotice({
        type: 'success',
        message: 'Immobile eliminato correttamente dal database Nexus.'
      });
    } catch (err: any) {
      setBannerNotice({
        type: 'error',
        message: `Impossibile eliminare: ${err.message}`
      });
    }
  };

  const handleQuickSync = async (property: Property) => {
    setIsSyncingId(property.id);
    setBannerNotice(null);
    try {
      const res = await api.syncTo2D(property.id);
      const updatedList = properties.map(p => (p.id === property.id ? res.property : p));
      setProperties(updatedList);
      setBannerNotice({
        type: 'success',
        message: `✅ Immobile ${property.property_id} sincronizzato con successo con il Backend 2D (Versione ${res.property.sync_2d_version})!`
      });
    } catch (err: any) {
      setBannerNotice({
        type: 'error',
        message: `Errore sincronizzazione 2D: ${err.message}`
      });
    } finally {
      setIsSyncingId(null);
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-amber-800">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-700" />
          <span className="text-xs font-bold font-mono tracking-widest uppercase text-slate-700">Inizializzazione 2D Nexus...</span>
        </div>
      </div>
    );
  }

  if (!operator) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        operator={operator}
        onLogout={handleLogout}
        onOpenOperatorsAdmin={() => setShowOperatorsAdmin(true)}
        onOpenSyncLogs={() => setShowSyncLogs(true)}
        onOpenSqlSchema={() => setShowSqlSchema(true)}
        onOpenGeocodeCache={() => setShowGeocodeCache(true)}
        onGoHome={() => {
          setCurrentView('dashboard');
          setEditingProperty(null);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {/* Global Notification Banner */}
        {bannerNotice && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-center justify-between text-xs font-bold shadow-xs transition-all ${
              bannerNotice.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-950'
                : 'bg-rose-50 border border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {bannerNotice.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{bannerNotice.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setBannerNotice(null)}
              className="text-slate-500 hover:text-slate-900 transition font-bold cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {currentView === 'dashboard' ? (
          <Dashboard
            properties={properties}
            operator={operator}
            territories={territories}
            markets={markets}
            onNewProperty={handleNewProperty}
            onEditProperty={handleEditProperty}
            onViewProperty={p => setViewingProperty(p)}
            onDeleteProperty={handleDeleteProperty}
            onQuickSync={handleQuickSync}
            isSyncingId={isSyncingId}
          />
        ) : (
          <PropertyForm
            initialProperty={editingProperty}
            defaultType={defaultNewType}
            operator={operator}
            territories={territories}
            markets={markets}
            onSaveSuccess={savedProp => {
              handleSavePropertySuccess(savedProp);
              setCurrentView('dashboard');
              setEditingProperty(null);
            }}
            onCancel={() => {
              setCurrentView('dashboard');
              setEditingProperty(null);
            }}
          />
        )}
      </main>

      {/* Modals */}
      <PropertyDetailModal
        property={viewingProperty}
        operator={operator}
        onClose={() => setViewingProperty(null)}
        onEdit={p => {
          setViewingProperty(null);
          handleEditProperty(p);
        }}
        onSync={p => {
          setViewingProperty(null);
          handleQuickSync(p);
        }}
      />

      {showOperatorsAdmin && (
        <OperatorsAdminModal onClose={() => setShowOperatorsAdmin(false)} />
      )}

      {showSyncLogs && (
        <SyncLogsModal onClose={() => setShowSyncLogs(false)} />
      )}

      {showSqlSchema && (
        <SqlSchemaModal onClose={() => setShowSqlSchema(false)} />
      )}

      {showGeocodeCache && (
        <GeocodeCacheModal onClose={() => setShowGeocodeCache(false)} />
      )}
    </div>
  );
}
