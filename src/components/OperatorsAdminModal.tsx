import React, { useState, useEffect } from 'react';
import { Operator } from '../types';
import { api } from '../services/api';
import {
  X,
  Users,
  Shield,
  Lock,
  Unlock,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Key,
  Compass
} from 'lucide-react';

interface OperatorsAdminModalProps {
  onClose: () => void;
}

export const OperatorsAdminModal: React.FC<OperatorsAdminModalProps> = ({ onClose }) => {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // New Operator state
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [newCanEditCoords, setNewCanEditCoords] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    setLoading(true);
    try {
      const res = await api.getOperators();
      setOperators(res.operators);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCanEditCoords = async (op: Operator) => {
    try {
      const res = await api.updateOperator(op.id, {
        can_edit_coords: !op.can_edit_coords
      });
      setOperators(operators.map(o => (o.id === op.id ? res.operator : o)));
    } catch (err: any) {
      alert(`Errore: ${err.message}`);
    }
  };

  const handleUnlock = async (op: Operator) => {
    try {
      const res = await api.updateOperator(op.id, {
        unlock: true
      });
      setOperators(operators.map(o => (o.id === op.id ? res.operator : o)));
      alert(`Account ${op.email} sbloccato con successo.`);
    } catch (err: any) {
      alert(`Errore sblocco: ${err.message}`);
    }
  };

  const handleRoleChange = async (op: Operator, role: 'admin' | 'editor' | 'viewer') => {
    try {
      const res = await api.updateOperator(op.id, { role });
      setOperators(operators.map(o => (o.id === op.id ? res.operator : o)));
    } catch (err: any) {
      alert(`Errore: ${err.message}`);
    }
  };

  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || !newName) return;

    try {
      const res = await api.createOperator({
        username: newEmail.split('@')[0] || newName.toLowerCase().replace(/\s+/g, '.'),
        email: newEmail,
        name: newName,
        password: newPassword,
        role: newRole,
        can_edit_coords: newCanEditCoords
      });
      setOperators([...operators, res.operator]);
      setShowCreateForm(false);
      setNewEmail('');
      setNewName('');
      setNewPassword('');
    } catch (err: any) {
      alert(`Errore creazione operatore: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-slate-900 tracking-tight">
                Gestione Operatori & Ruoli Nexus
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Amministrazione permessi, abilitazione modifica coordinate pin e sblocco account.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition cursor-pointer shadow-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Operatori Registrati ({operators.length})
            </span>
            <button
              type="button"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-bold text-xs shadow-md transition hover:scale-105 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              {showCreateForm ? 'Nascondi Form' : 'Aggiungi Nuovo Operatore'}
            </button>
          </div>

          {/* New Operator Form */}
          {showCreateForm && (
            <form onSubmit={handleCreateOperator} className="p-6 bg-white rounded-2xl border border-slate-200 space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider font-mono">Nuovo Profilo Operatore</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nome Completo:</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="es. Giulia Bianchi"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Aziendale:</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="giulia@2dsviluppoimmobiliare.it"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Password:</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Ruolo:</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-600 font-medium"
                  >
                    <option value="editor">Editor (Operatore Standard)</option>
                    <option value="viewer">Viewer (Collaboratore Esterno con Revisione)</option>
                    <option value="admin">Admin (Amministratore Completo)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCanEditCoords}
                    onChange={e => setNewCanEditCoords(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-0"
                  />
                  <span className="text-xs text-slate-700 font-semibold">Abilita Modifica Manuale Coordinate Pin Mappa</span>
                </label>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-bold text-xs shadow-md transition hover:scale-105 cursor-pointer"
                >
                  Salva Operatore
                </button>
              </div>
            </form>
          )}

          {/* Operator Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-200 shadow-sm">
            {operators.map(op => (
              <div key={op.id} className="p-4 flex flex-wrap items-center justify-between gap-3.5 hover:bg-slate-50 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{op.name || op.username}</span>
                    {op.is_locked && (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 font-bold">
                        Account Bloccato
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5 font-medium">{op.email}</div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Role Selector */}
                  <select
                    value={op.role}
                    onChange={e => handleRoleChange(op, e.target.value as any)}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-600 shadow-xs"
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>

                  {/* Can edit coords button */}
                  <button
                    type="button"
                    onClick={() => handleToggleCanEditCoords(op)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      op.can_edit_coords
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                    title="Abilita/Disabilita trascinamento pin Leaflet"
                  >
                    <Compass className="w-3.5 h-3.5 text-amber-700" />
                    {op.can_edit_coords ? 'Pin Edit: Attivo' : 'Pin Edit: Bloccato'}
                  </button>

                  {/* Unlock Button if locked */}
                  {op.is_locked && (
                    <button
                      type="button"
                      onClick={() => handleUnlock(op)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md cursor-pointer"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      Sblocca
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
