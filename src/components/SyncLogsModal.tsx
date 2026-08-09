import React, { useState, useEffect } from 'react';
import { SyncLog } from '../types';
import { api } from '../services/api';
import { X, Activity, CheckCircle2, XCircle, RefreshCw, Code2 } from 'lucide-react';

interface SyncLogsModalProps {
  onClose: () => void;
}

export const SyncLogsModal: React.FC<SyncLogsModalProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayload, setSelectedPayload] = useState<any | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getSyncLogs();
      setLogs(res.logs);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-slate-900 tracking-tight">
                Log Eventi di Sincronizzazione (nexus_sync_log)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tracciamento immutabile degli invii verso il Backend 2D e il Match Engine.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={fetchLogs}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer hover:text-amber-800 shadow-xs"
              title="Aggiorna Log"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50">
          {selectedPayload && (
            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono text-amber-900 font-bold">Payload Trasmesso per Immobile ID #{selectedPayload.property_id}</span>
                <button
                  type="button"
                  onClick={() => setSelectedPayload(null)}
                  className="text-xs text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
                >
                  Chiudi Dettaglio
                </button>
              </div>
              <pre className="text-[11px] font-mono text-amber-900 max-h-48 overflow-y-auto bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-inner">
                {JSON.stringify(selectedPayload, null, 2)}
              </pre>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-200 shadow-sm">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-mono">
                Nessun log di sincronizzazione registrato.
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="p-4 flex flex-wrap items-center justify-between gap-3.5 text-xs hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3.5">
                    {log.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 uppercase">{log.action}</span>
                        <span className="font-mono text-[11px] text-amber-900 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {log.property_id_str || `ID #${log.property_id}`}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                          v{log.version}
                        </span>
                      </div>
                      <div className="text-slate-600 mt-1 font-medium">{log.message}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-slate-500 font-medium">
                      {new Date(log.created_at).toLocaleString('it-IT')}
                    </span>
                    {log.payload && (
                      <button
                        type="button"
                        onClick={() => setSelectedPayload(log.payload)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-mono font-bold border border-slate-200 transition cursor-pointer shadow-xs"
                      >
                        Payload
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
