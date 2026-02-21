import React, { useState } from 'react';
import { SIGNALS } from '@/signals';
import { computeEnergyFromFunc, computePowerFromFunc, formatEnergy } from '@/utils/signalAnalysis';
import { Zap, Calculator } from 'lucide-react';
import { motion } from 'framer-motion';

export const PowerCalculationView: React.FC = () => {
  const [tStart, setTStart] = useState(0);
  const [tEnd, setTEnd] = useState(10);
  const [energy, setEnergy] = useState<number | null>(null);
  const [power, setPower] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = () => {
    setLoading(true);
    setTimeout(() => {
      const signalFunc = SIGNALS['x11(t)'].func;
      const e = computeEnergyFromFunc(signalFunc, tStart, tEnd);
      const p = computePowerFromFunc(signalFunc, tStart, tEnd);
      setEnergy(e);
      setPower(p);
      setLoading(false);
    }, 100);
  };

  return (
    <div className="space-y-6">
      {/* Signal Info */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-primary/5 to-signal-blue/5 border border-primary/15">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <Zap className="text-primary" size={18} />
          Signal x11(t) = sin(4π)
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Puissance moyenne sur un intervalle [t_start, t_end]
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
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-all text-sm font-semibold whitespace-nowrap"
        >
          <Zap size={16} />
          {loading ? 'Calcul...' : 'Calculer'}
        </button>
      </div>

      {/* Results */}
      {energy !== null && power !== null && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-xl bg-signal-green/5 border border-signal-green/20">
              <p className="text-xs font-semibold text-signal-green uppercase tracking-wider">Énergie Totale</p>
              <p className="text-3xl font-bold text-foreground mt-2 font-mono">{formatEnergy(energy)}</p>
              <p className="text-xs text-muted-foreground mt-1">Joules (J)</p>
            </div>

            <div className="p-6 rounded-xl bg-signal-blue/5 border border-signal-blue/20">
              <p className="text-xs font-semibold text-signal-blue uppercase tracking-wider">Puissance Moyenne</p>
              <p className="text-3xl font-bold text-foreground mt-2 font-mono">{formatEnergy(power)}</p>
              <p className="text-xs text-muted-foreground mt-1">Watts (W)</p>
            </div>
          </div>

          {/* Calculation Details */}
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
                </ul>
              </div>

              <div className="pt-3 border-t border-border/50 bg-signal-amber/5 p-3 rounded-lg">
                <p className="font-medium text-foreground text-xs">Note Mathématique</p>
                <p className="text-muted-foreground text-xs mt-1">
                  x11(t) = sin(4π) est une constante nulle (≈0), donc E = 0 et P = 0 pour tout intervalle.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
