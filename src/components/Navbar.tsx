import React from 'react';
import { Operator } from '../types';
import {
  LogOut,
  Users,
  Database,
  Activity,
  Compass,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  operator: Operator;
  onLogout: () => void;
  onOpenOperatorsAdmin: () => void;
  onOpenSyncLogs: () => void;
  onOpenSqlSchema: () => void;
  onOpenGeocodeCache: () => void;
  onGoHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  operator,
  onLogout,
  onOpenOperatorsAdmin,
  onOpenSyncLogs,
  onOpenSqlSchema,
  onOpenGeocodeCache,
  onGoHome
}) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      case 'editor':
        return 'bg-blue-100 text-blue-900 border-blue-300 font-bold';
      default:
        return 'bg-purple-100 text-purple-900 border-purple-300 font-bold';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3.5 cursor-pointer group" onClick={onGoHome}>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white font-display font-black text-2xl flex items-center justify-center shadow-md shadow-amber-600/20 group-hover:scale-105 transition">
            2D
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold font-display tracking-tight text-slate-950 group-hover:text-amber-700 transition">
                2D NEXUS
              </h1>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                v2.0
              </span>
            </div>
            <p className="text-[11px] tracking-wide text-slate-500 font-medium flex items-center gap-1.5">
              <span>Sviluppo Immobiliare</span>
              <span className="text-slate-300">•</span>
              <span className="text-amber-700 font-semibold">Puglia Luxury & Operations</span>
            </p>
          </div>
        </div>

        {/* Center: System Status Indicators */}
        <div className="hidden lg:flex items-center gap-3 text-xs">
          <div className="px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-2 font-medium shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
            Backend 2D: <strong className="text-emerald-700 font-semibold">Connesso</strong>
          </div>

          <div className="px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-2 font-medium shadow-xs">
            <Compass className="w-3.5 h-3.5 text-amber-600" />
            Geocoding Multi-Tier: <strong className="text-amber-800 font-semibold">Attivo (1ms)</strong>
          </div>
        </div>

        {/* Right: Tools & Operator Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Tools buttons */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200 rounded-xl p-1 shadow-xs">
            {operator.role === 'admin' && (
              <button
                type="button"
                onClick={onOpenOperatorsAdmin}
                className="p-2 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-white transition cursor-pointer"
                title="Gestione Operatori (Admin)"
              >
                <Users className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onOpenSyncLogs}
              className="p-2 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-white transition cursor-pointer"
              title="Log Eventi Sincronizzazione"
            >
              <Activity className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenSqlSchema}
              className="p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-white transition cursor-pointer"
              title="Schema MySQL 8.0 DDL"
            >
              <Database className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenGeocodeCache}
              className="p-2 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-white transition cursor-pointer"
              title="Cache Geocoding SHA-256"
            >
              <Compass className="w-4 h-4" />
            </button>
          </div>

          {/* Operator Chip */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                {operator.name || operator.username}
              </span>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${getRoleBadge(operator.role)}`}>
                  {operator.role}
                </span>
                {operator.can_edit_coords && (
                  <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    📍 Pin Edit
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 transition cursor-pointer shadow-xs"
              title="Disconnetti operatore"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
