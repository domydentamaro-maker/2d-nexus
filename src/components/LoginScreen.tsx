import React, { useState } from 'react';
import { api } from '../services/api';
import { Operator } from '../types';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Sparkles, Building2, CheckCircle2 } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (operator: Operator) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('domenico@2dsviluppoimmobiliare.it');
  const [password, setPassword] = useState('Domenico2D!2026');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.login(email, password);
      onLoginSuccess(res.operator);
    } catch (err: any) {
      setErrorMsg(err.message || 'Errore di autenticazione');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (em: string, pw: string) => {
    setEmail(em);
    setPassword(pw);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Warm Architectural Pattern Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-70" />
      <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-amber-100/40 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-18 h-18 rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white font-display font-black text-3xl shadow-xl shadow-amber-600/25 mb-1 ring-4 ring-amber-100">
            2D
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-slate-950">
            2D NEXUS HUB
          </h1>
          <p className="text-xs font-semibold tracking-wider text-amber-800 uppercase">
            2D Sviluppo Immobiliare • Puglia Luxury Portfolio
          </p>
          <p className="text-xs text-slate-600 max-w-md mx-auto pt-1 leading-relaxed">
            Piattaforma gestionale per l'acquisizione, geolocalizzazione e sincronizzazione ad alta precisione del patrimonio immobiliare.
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xl shadow-slate-200/50 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 shadow-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="leading-relaxed font-medium">{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Email Operatore Aziendale
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="operatore@2dsviluppoimmobiliare.it"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 transition font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Password di Accesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 transition font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-600/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              {loading ? (
                <span className="font-semibold">Verifica credenziali in corso...</span>
              ) : (
                <>
                  <span>Accedi a Nexus 2D</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-500 flex items-center justify-center gap-1.5 font-medium">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Autenticazione sicura JWT & Protezione Brute-Force 2D Nexus
            </span>
          </div>
        </div>

        {/* Quick Role Tester Switcher */}
        <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-3xl p-5 space-y-3 shadow-sm">
          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            Profili di Test Rapido (Seleziona per inserire le credenziali):
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => handleQuickSelect('domenico@2dsviluppoimmobiliare.it', 'Domenico2D!2026')}
              className="w-full text-left p-3 rounded-2xl bg-amber-50/60 hover:bg-amber-100/80 border border-amber-200 text-xs flex items-center justify-between transition group cursor-pointer"
            >
              <div>
                <span className="text-slate-950 font-bold block group-hover:text-amber-900 transition">Domenico Dentamaro</span>
                <span className="text-[11px] text-slate-600 font-mono">domenico@2dsviluppoimmobiliare.it</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300 text-[11px] font-bold">
                Admin (Completo)
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('marco.collaboratore@2dsviluppoimmobiliare.it', 'Editor2D!2026')}
              className="w-full text-left p-3 rounded-2xl bg-blue-50/60 hover:bg-blue-100/80 border border-blue-200 text-xs flex items-center justify-between transition group cursor-pointer"
            >
              <div>
                <span className="text-slate-950 font-bold block group-hover:text-blue-900 transition">Marco Rossi</span>
                <span className="text-[11px] text-slate-600 font-mono">marco.collaboratore@2d...</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-200/80 text-blue-900 border border-blue-300 text-[11px] font-bold">
                Editor (Fidato)
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('agenzia.partner@2dsviluppoimmobiliare.it', 'Viewer2D!2026')}
              className="w-full text-left p-3 rounded-2xl bg-purple-50/60 hover:bg-purple-100/80 border border-purple-200 text-xs flex items-center justify-between transition group cursor-pointer"
            >
              <div>
                <span className="text-slate-950 font-bold block group-hover:text-purple-900 transition">Agenzia Partner</span>
                <span className="text-[11px] text-slate-600 font-mono">agenzia.partner@2d...</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-purple-200/80 text-purple-900 border border-purple-300 text-[11px] font-bold">
                Viewer (Esterno)
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
