import React, { useState } from 'react';
import { SIGNALS } from '@/signals';
import { analyzeAllSignals, formatEnergy } from '@/utils/signalAnalysis';
import { AnalysisResult } from '@/types';
import { Zap, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const EnergyClassificationView: React.FC = () => {
  const [method, setMethod] = useState<'trapeze' | 'simpson'>('trapeze');
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleClassify = () => {
    setLoading(true);
    setTimeout(() => {
      const analysisResults = analyzeAllSignals(SIGNALS, method);
      setResults(analysisResults);
      setLoading(false);
    }, 100);
  };

  const energyStats = results.length > 0 ? {
    energyCount: results.filter(r => !r.classification.includes('puissance')).length,
    powerCount: results.filter(r => r.classification.includes('puissance')).length,
    minEnergy: Math.min(...results.filter(r => isFinite(r.energy)).map(r => r.energy)),
    maxEnergy: Math.max(...results.filter(r => isFinite(r.energy)).map(r => r.energy)),
  } : null;

  return (
    <div className="space-y-6">
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
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-all text-sm font-semibold"
        >
          <Play size={16} />
          {loading ? 'En cours...' : 'Classifier'}
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
              { label: 'Min Énergie', value: formatEnergy(energyStats.minEnergy), color: 'primary' },
              { label: 'Max Énergie', value: formatEnergy(energyStats.maxEnergy), color: 'signal-amber' },
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
      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-border overflow-hidden"
        >
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
                {results.map((result, idx) => (
                  <motion.tr
                    key={idx}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-foreground">{result.signalName}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{formatEnergy(result.energy)}</td>
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
