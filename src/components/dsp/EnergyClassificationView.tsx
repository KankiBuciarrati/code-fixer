import React, { useState } from 'react';
import { callPython } from '@/lib/pyodideRuntime';
import { usePyodide } from '@/hooks/usePyodide';
import { AnalysisResult } from '@/types';
import { Zap, Play, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PyAnalysisRow {
  signalName: string;
  energy: number | null;
  energyIsInfinite: boolean;
  classification: string;
}

function formatEnergyJS(e: number | null, isInf: boolean): string {
  if (isInf || e === null) return '∞';
  if (e === 0) return '0';
  if (Math.abs(e) < 1e-3 || Math.abs(e) > 1e3) return e.toExponential(3);
  return e.toFixed(3);
}

export const EnergyClassificationView: React.FC = () => {
  const [method, setMethod] = useState<'trapeze' | 'simpson'>('trapeze');
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [rawRows, setRawRows] = useState<PyAnalysisRow[]>([]);
  const [loading, setLoading] = useState(false);
  const py = usePyodide();

  const handleClassify = async () => {
    if (!py.ready) return;
    setLoading(true);
    try {
      const rows = await callPython<PyAnalysisRow[]>('analyze_all_signals', [method, -10, 10, 1000]);
      setRawRows(rows);
      setResults(
        rows.map((r) => ({
          signalName: r.signalName,
          energy: r.energyIsInfinite ? Infinity : r.energy ?? NaN,
          classification: r.classification,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  const energyStats =
    results.length > 0
      ? {
          energyCount: results.filter((r) => !r.classification.includes('puissance')).length,
          powerCount: results.filter((r) => r.classification.includes('puissance')).length,
          minEnergy: Math.min(...results.filter((r) => isFinite(r.energy)).map((r) => r.energy)),
          maxEnergy: Math.max(...results.filter((r) => isFinite(r.energy)).map((r) => r.energy)),
        }
      : null;

  return (
    <div className="space-y-6">
      {/* Pyodide status */}
      <div className="text-xs text-muted-foreground flex items-center gap-2">
        {py.loading && (
          <>
            <Loader2 size={12} className="animate-spin" /> Chargement de Python (Pyodide)…
          </>
        )}
        {py.ready && <span className="text-signal-green">● Runtime Python prêt</span>}
        {py.error && <span className="text-destructive">Erreur Pyodide : {py.error}</span>}
      </div>

      {/* Method Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Zap className="text-signal-amber" size={18} />
          Méthode d'Intégration
        </div>
        <div className="flex gap-2">
          {(['trapeze', 'simpson'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                method === m
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {m === 'trapeze' ? 'Trapèzes' : 'Simpson'}
            </button>
          ))}
        </div>
        <button
          onClick={handleClassify}
          disabled={loading || !py.ready}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-all text-sm font-semibold"
        >
          <Play size={16} />
          {loading ? 'En cours...' : 'Classifier (Python)'}
        </button>
      </div>

      {/* Stats Cards */}
      <AnimatePresence>
        {energyStats && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {[
              { label: "Signaux d'Énergie", value: energyStats.energyCount, color: 'signal-green' },
              { label: 'Signaux de Puissance', value: energyStats.powerCount, color: 'signal-blue' },
              { label: 'Min Énergie', value: formatEnergyJS(energyStats.minEnergy, !isFinite(energyStats.minEnergy)), color: 'primary' },
              { label: 'Max Énergie', value: formatEnergyJS(energyStats.maxEnergy, !isFinite(energyStats.maxEnergy)), color: 'signal-amber' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl bg-muted/50 border border-border/50"
              >
                <p className={`text-xs font-semibold text-${stat.color} uppercase tracking-wider`}>{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1 font-mono">{stat.value}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Table */}
      {rawRows.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">Signal</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">Énergie (J)</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">Classification</th>
                </tr>
              </thead>
              <tbody>
                {rawRows.map((result, idx) => (
                  <motion.tr
                    key={idx}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-foreground">{result.signalName}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {formatEnergyJS(result.energy, result.energyIsInfinite)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          result.classification.includes('puissance')
                            ? 'bg-signal-blue/10 text-signal-blue'
                            : 'bg-signal-green/10 text-signal-green'
                        }`}
                      >
                        {result.classification}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};
