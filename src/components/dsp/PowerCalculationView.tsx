import React, { useState } from 'react';
import { callPython } from '@/lib/pyodideRuntime';
import { usePyodide } from '@/hooks/usePyodide';
import { Zap, Calculator, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

function formatEnergyJS(e: number): string {
  if (!isFinite(e)) return '∞';
  if (e === 0) return '0';
  if (Math.abs(e) < 1e-3 || Math.abs(e) > 1e3) return e.toExponential(3);
  return e.toFixed(3);
}

export const PowerCalculationView: React.FC = () => {
  const [tStart, setTStart] = useState(0);
  const [tEnd, setTEnd] = useState(10);
  const [energy, setEnergy] = useState<number | null>(null);
  const [power, setPower] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const py = usePyodide();

  const handleCalculate = async () => {
    if (!py.ready) return;
    setLoading(true);
    try {
      const [e, p] = await Promise.all([
        callPython<number>('energy_of_signal', ['x11(t)', tStart, tEnd, 1000, 'trapeze']),
        callPython<number>('power_of_signal', ['x11(t)', tStart, tEnd, 1000]),
      ]);
      setEnergy(e);
      setPower(p);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-xs text-muted-foreground flex items-center gap-2">
        {py.loading && (
          <>
            <Loader2 size={12} className="animate-spin" /> Chargement de Python (Pyodide)…
          </>
        )}
        {py.ready && <span className="text-signal-green">● Runtime Python prêt</span>}
        {py.error && <span className="text-destructive">Erreur Pyodide : {py.error}</span>}
      </div>

      {/* Signal Info */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-primary/5 to-signal-blue/5 border border-primary/15">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <Zap className="text-primary" size={18} />
          Signal x11(t) = sin(4π)
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Puissance moyenne sur un intervalle [t_start, t_end] — calcul délégué à Python (Pyodide)
        </p>
      </div>

      {/* Parameters */}
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <Calculator size={14} className="inline mr-1" />
            Début (t_start)
          </label>
          <input
            type="number"
            value={tStart}
            onChange={(e) => setTStart(parseFloat(e.target.value))}
            step={0.5}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        <div className="flex-1">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fin (t_end)</label>
          <input
            type="number"
            value={tEnd}
            onChange={(e) => setTEnd(parseFloat(e.target.value))}
            step={0.5}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        <button
          onClick={handleCalculate}
          disabled={loading || !py.ready}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-all text-sm font-semibold whitespace-nowrap"
        >
          <Zap size={16} />
          {loading ? 'Calcul...' : 'Calculer'}
        </button>
      </div>

      {/* Results */}
      {energy !== null && power !== null && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-xl bg-signal-green/5 border border-signal-green/20">
              <p className="text-xs font-semibold text-signal-green uppercase tracking-wider">Énergie Totale</p>
              <p className="text-3xl font-bold text-foreground mt-2 font-mono">{formatEnergyJS(energy)}</p>
              <p className="text-xs text-muted-foreground mt-1">Joules (J)</p>
            </div>

            <div className="p-6 rounded-xl bg-signal-blue/5 border border-signal-blue/20">
              <p className="text-xs font-semibold text-signal-blue uppercase tracking-wider">Puissance Moyenne</p>
              <p className="text-3xl font-bold text-foreground mt-2 font-mono">{formatEnergyJS(power)}</p>
              <p className="text-xs text-muted-foreground mt-1">Watts (W)</p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-muted/30 border border-border/50 space-y-4">
            <h4 className="font-semibold text-foreground text-sm">Détails du Calcul</h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-foreground">Formule de Puissance Moyenne</p>
                <p className="font-mono text-muted-foreground mt-1">P = (1/T) × ∫|x(t)|² dt</p>
              </div>
              <div className="pt-3 border-t border-border/50">
                <p className="font-medium text-foreground">Paramètres</p>
                <ul className="space-y-1 mt-2 text-muted-foreground text-xs font-mono">
                  <li>• Intervalle: [{tStart}, {tEnd}]</li>
                  <li>• Durée T = {(tEnd - tStart).toFixed(2)} s</li>
                  <li>• Moteur de calcul : Python 3.x via Pyodide (WASM)</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
