const rect = (t: number): number => Math.abs(t) < 0.5 ? 1 : 0;
const tri = (t: number): number => Math.abs(t) < 1 ? 1 - Math.abs(t) : 0;
const u = (t: number): number => t >= 0 ? 1 : 0;
const delta = (t: number): number => {
  const epsilon = 0.01;
  return (1 / (epsilon * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * (t / epsilon) ** 2);
};
const ramp = (t: number): number => t > 0 ? t : 0;

const mathContext: Record<string, unknown> = {
  rect, tri, u, delta, ramp,
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  exp: Math.exp, log: Math.log, ln: Math.log,
  sqrt: Math.sqrt, abs: Math.abs,
  pi: Math.PI, e: Math.E,
};

function preprocessFormula(formula: string): string {
  return formula
    .replace(/\s+/g, '')
    .replace(/π/g, 'pi')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\^/g, '**')
    .replace(/(\d+)([a-zA-Z(])/g, '$1*$2')
    .replace(/\)(\d+)/g, ')*$1')
    .replace(/\)\(/g, ')*(');
}

function evaluateForT(formula: string, tValue: number): number {
  try {
    const processed = preprocessFormula(formula);
    const funcBody = `
      with (context) {
        const t = ${tValue};
        return ${processed};
      }
    `;
    const func = new Function('context', funcBody);
    const result = func(mathContext);
    return isFinite(result) ? result : 0;
  } catch {
    return 0;
  }
}

export function parseFormula(formula: string): (t: number[]) => number[] {
  return (t: number[]) => t.map(ti => evaluateForT(formula, ti));
}

export function validateFormula(formula: string): { valid: boolean; error?: string } {
  try {
    const testT = [0, 1, -1];
    parseFormula(formula)(testT);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Formule invalide' };
  }
}

export const availableFunctions = {
  signals: [
    { name: 'rect(t)', description: 'Rectangle (1 si |t|<0.5)' },
    { name: 'tri(t)', description: 'Triangle (1-|t| si |t|<1)' },
    { name: 'u(t)', description: 'Échelon (1 si t≥0)' },
    { name: 'delta(t)', description: 'Dirac (approximation)' },
    { name: 'ramp(t)', description: 'Rampe (t si t>0)' },
  ],
  math: [
    { name: 'sin, cos, tan', description: 'Trigonométrie' },
    { name: 'exp, log, sqrt', description: 'Exp / Log / Racine' },
    { name: 'abs', description: 'Valeur absolue' },
  ],
};

export const formulaExamples = [
  '2*rect(2*t-1)',
  'sin(pi*t)*rect(t/2)',
  'tri(2*t)',
  'u(t-2)',
  'exp(-t)*u(t)',
  '2*sin(3*t) + cos(t)',
  'abs(sin(2*pi*t))',
];
