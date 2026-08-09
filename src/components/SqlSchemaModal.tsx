import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, Database, Copy, Check, Download } from 'lucide-react';

interface SqlSchemaModalProps {
  onClose: () => void;
}

export const SqlSchemaModal: React.FC<SqlSchemaModalProps> = ({ onClose }) => {
  const [schemaSql, setSchemaSql] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSchema();
  }, []);

  const fetchSchema = async () => {
    try {
      const res = await api.getSchema();
      setSchemaSql(res.schema_sql);
    } catch (e) {
      // fallback
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(schemaSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([schemaSql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '2d_nexus_001_initial_schema.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-slate-900 tracking-tight">
                Schema Database MySQL 8.0 (DDL Pronto all'Uso)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tabelle: nexus_properties, nexus_operators, nexus_territories, nexus_markets, nexus_sync_log, nexus_geocode_cache.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition cursor-pointer shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-amber-700" />}
              {copied ? 'Copiato!' : 'Copia DDL SQL'}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white text-xs font-bold shadow-md transition hover:scale-105 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Scarica .sql
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition cursor-pointer shadow-xs"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SQL Code Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-900">
          <pre className="text-xs font-mono text-amber-200/90 leading-relaxed overflow-x-auto selection:bg-amber-500 selection:text-slate-950 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
            {schemaSql || 'Caricamento schema...'}
          </pre>
        </div>
      </div>
    </div>
  );
};
