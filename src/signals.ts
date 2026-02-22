import { SignalsDict } from './types';

const x1 = (t: number[]): number[] => {
  const rect = (tu: number) => Math.abs(tu) < 0.5 ? 1 : 0;
  return t.map(ti => 2 * rect(2 * ti - 1));
};

const x2 = (t: number[]): number[] => {
  return t.map(ti => {
    const rect = Math.abs(ti / 2) < 0.5 ? 1 : 0;
    return Math.sin(Math.PI * ti) * rect;
  });
};

const x3 = (t: number[]): number[] => {
  return t.map(ti => {
    const scaled = 2 * ti;
    return Math.abs(scaled) < 1 ? 1 - Math.abs(scaled) : 0;
  });
};

// U(t-2) : échelon → s'étend sur [2, +∞[, énergie infinie, puissance = 1
const x4 = (t: number[]): number[] => {
  return t.map(ti => (ti >= 2 ? 1 : 0));
};

// U(3-t) : échelon inversé → s'étend sur ]-∞, 3], énergie infinie, puissance = 1
const x5 = (t: number[]): number[] => {
  return t.map(ti => (ti <= 3 ? 1 : 0));
};

const x6 = (t: number[]): number[] => {
  const epsilon = 0.01;
  const deltaApprox = (ti: number, t0: number) => {
    const exp = Math.exp(-0.5 * Math.pow((ti - t0) / epsilon, 2));
    return (1 / (epsilon * Math.sqrt(2 * Math.PI))) * exp;
  };
  return t.map(ti =>
      2 * deltaApprox(ti, -1) - deltaApprox(ti, 2) +
      deltaApprox(ti, 0) - 2 * deltaApprox(ti, 1)
  );
};

const x7 = (t: number[]): number[] => {
  const rect = (tu: number) => Math.abs(tu) < 0.5 ? 1 : 0;
  return t.map(ti => rect((ti - 1) / 2) - rect((ti + 1) / 2));
};

const x8 = (t: number[]): number[] => {
  const tri = (tu: number) => Math.abs(tu) < 1 ? 1 - Math.abs(tu) : 0;
  return t.map(ti => tri(ti - 1) - tri(ti + 1));
};

const x9 = (t: number[]): number[] => {
  const rect = (tu: number) => Math.abs(tu) < 0.5 ? 1 : 0;
  const tri = (tu: number) => Math.abs(tu) < 1 ? 1 - Math.abs(tu) : 0;
  return t.map(ti => rect(ti / 2) - tri(ti));
};

// exp(-t)u(t-2) : intégrale de 2 à +∞ converge → énergie finie
// On l'étend sur une grande fenêtre pour l'approcher numériquement
const x10 = (t: number[]): number[] => {
  return t.map(ti => Math.exp(-ti) * (ti >= 2 ? 1 : 0));
};

// sin(4πt) : sinusoïde pure → s'étend sur ]-∞, +∞[, énergie infinie, puissance finie = 1/2
const x11 = (t: number[]): number[] => {
  return t.map(ti => Math.sin(4 * Math.PI * ti));
};

const x12 = (t: number[]): number[] => {
  const ramp = (tu: number) => tu > 0 ? tu : 0;
  return t.map(ti => ramp(ti + 1) - 2 * ramp(ti) + ramp(ti - 1));
};

export const SIGNALS: SignalsDict = {
  // Signaux à support borné → énergie finie
  'x1(t)':  { func: x1,  formula: '2Rect(2t-1)',                      duration: 'finite'   },
  'x2(t)':  { func: x2,  formula: 'sin(πt)Rect(t/2)',                 duration: 'finite'   },
  'x3(t)':  { func: x3,  formula: 'Tri(2t)',                           duration: 'finite'   },
  'x6(t)':  { func: x6,  formula: '2δ(t+1)-δ(t-2)+δ(t)-2δ(t-1)',     duration: 'finite'   },
  'x7(t)':  { func: x7,  formula: 'Rect((t-1)/2)-Rect((t+1)/2)',      duration: 'finite'   },
  'x8(t)':  { func: x8,  formula: 'Tri(t-1)-Tri(t+1)',                duration: 'finite'   },
  'x9(t)':  { func: x9,  formula: 'Rect(t/2)-Tri(t)',                  duration: 'finite'   },
  'x11(t)': { func: x11, formula: 'sin(4πt)',                          duration: 'infinite' },
  'x12(t)': { func: x12, formula: 'R(t+1)-2R(t)+R(t-1)',              duration: 'finite'   },

  // exp(-t)u(t-2) : intégrale converge sur [2,+∞[ → énergie finie
  'x10(t)': { func: x10, formula: 'exp(-t)u(t-2)',                     duration: 'finite'   },

  // Échelons → s'étendent à l'infini → énergie infinie, puissance finie
  'x4(t)':  { func: x4,  formula: 'U(t-2)',                            duration: 'infinite' },
  'x5(t)':  { func: x5,  formula: 'U(3-t)',                            duration: 'infinite' },
};