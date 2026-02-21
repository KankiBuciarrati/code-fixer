import { SignalsDict, AnalysisResult } from '@/types';

export function linspace(start: number, end: number, num: number): number[] {
  const result: number[] = [];
  const step = (end - start) / (num - 1);
  for (let i = 0; i < num; i++) {
    result.push(start + step * i);
  }
  return result;
}

export function calculateEnergyTrapeze(signal: number[], dt: number): number {
  let energy = 0;
  for (let i = 0; i < signal.length - 1; i++) {
    const val1 = signal[i] * signal[i];
    const val2 = signal[i + 1] * signal[i + 1];
    energy += (val1 + val2) / 2 * dt;
  }
  return energy;
}

export function calculateEnergySimpson(signal: number[], dt: number): number {
  const n = signal.length;
  if (n < 3) return calculateEnergyTrapeze(signal, dt);

  let energy = 0;
  const squared = signal.map(v => v * v);

  for (let i = 0; i < n - 2; i += 2) {
    energy += (squared[i] + 4 * squared[i + 1] + squared[i + 2]) * dt / 3;
  }

  if (n % 2 === 0) {
    energy += (squared[n - 2] + squared[n - 1]) * dt / 2;
  }

  return energy;
}

export function calculateEnergy(signal: number[], dt: number, method: 'trapeze' | 'simpson' = 'trapeze'): number {
  if (method === 'simpson') {
    return calculateEnergySimpson(signal, dt);
  }
  return calculateEnergyTrapeze(signal, dt);
}

export function calculateAveragePower(signal: number[], tStart: number, tEnd: number): number {
  const dt = (tEnd - tStart) / signal.length;
  const energy = calculateEnergy(signal, dt);
  return energy / (tEnd - tStart);
}

export function classifySignal(energy: number, avgPower: number): string {
  const THRESHOLD = 1e10;
  if (energy < THRESHOLD && isFinite(energy)) {
    return 'Signal à énergie finie';
  }
  if (avgPower < THRESHOLD && isFinite(avgPower)) {
    return 'Signal à puissance moyenne finie';
  }
  return 'Signal à puissance infinie';
}

export function analyzeAllSignals(
  signals: SignalsDict,
  method: 'trapeze' | 'simpson' = 'trapeze',
  tStart: number = -10,
  tEnd: number = 10
): AnalysisResult[] {
  const results: AnalysisResult[] = [];
  const numPoints = 1000;
  const t = linspace(tStart, tEnd, numPoints);
  const dt = (tEnd - tStart) / (numPoints - 1);

  for (const [signalName, signal] of Object.entries(signals)) {
    try {
      const values = signal.func(t);
      const energy = calculateEnergy(values, dt, method);
      const avgPower = calculateAveragePower(values, tStart, tEnd);
      const classification = classifySignal(energy, avgPower);
      results.push({ signalName, energy, classification });
    } catch (error) {
      console.error(`Erreur lors de l'analyse du signal ${signalName}:`, error);
      results.push({ signalName, energy: NaN, classification: 'Erreur de calcul' });
    }
  }

  return results;
}

export function formatEnergy(energy: number): string {
  if (!isFinite(energy)) return '∞';
  if (energy === 0) return '0';
  if (Math.abs(energy) < 0.001 || Math.abs(energy) > 1000) {
    return energy.toExponential(3);
  }
  return energy.toFixed(3);
}

export function computeEnergyFromFunc(
  signalFunc: (t: number[]) => number[],
  tStart: number,
  tEnd: number,
  numPoints: number = 1000
): number {
  const t = linspace(tStart, tEnd, numPoints);
  const values = signalFunc(t);
  const dt = (tEnd - tStart) / (numPoints - 1);
  return calculateEnergyTrapeze(values, dt);
}

export function computePowerFromFunc(
  signalFunc: (t: number[]) => number[],
  tStart: number,
  tEnd: number,
  numPoints: number = 1000
): number {
  const t = linspace(tStart, tEnd, numPoints);
  const values = signalFunc(t);
  return calculateAveragePower(values, tStart, tEnd);
}
