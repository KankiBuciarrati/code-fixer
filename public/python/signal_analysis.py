"""
Logique de calcul des TP de Traitement du Signal.
Exécuté côté navigateur via Pyodide.

Toutes les fonctions reçoivent/retournent des types primitifs JSON-compatibles
(listes, dicts, floats) pour faciliter le passage Python <-> JS.
"""

import math
from typing import Callable, List, Dict, Any

# ─── Utilitaires numériques ───────────────────────────────────────────────────


def linspace(start: float, end: float, num: int) -> List[float]:
    if num < 2:
        return [start]
    step = (end - start) / (num - 1)
    return [start + step * i for i in range(num)]


def trapeze_energy(values: List[float], dt: float) -> float:
    """Énergie ∫|x(t)|² dt par méthode des trapèzes."""
    energy = 0.0
    n = len(values)
    for i in range(n - 1):
        v1 = values[i] * values[i]
        v2 = values[i + 1] * values[i + 1]
        energy += (v1 + v2) / 2.0 * dt
    return energy


def simpson_energy(values: List[float], dt: float) -> float:
    """Énergie via Simpson 1/3 (avec retombée trapèze sur le dernier intervalle si n pair)."""
    n = len(values)
    if n < 3:
        return trapeze_energy(values, dt)
    squared = [v * v for v in values]
    energy = 0.0
    i = 0
    while i <= n - 3:
        energy += (squared[i] + 4 * squared[i + 1] + squared[i + 2]) * dt / 3.0
        i += 2
    if n % 2 == 0:
        energy += (squared[n - 2] + squared[n - 1]) * dt / 2.0
    return energy


def compute_energy(values: List[float], dt: float, method: str = "trapeze") -> float:
    if method == "simpson":
        return simpson_energy(values, dt)
    return trapeze_energy(values, dt)


def average_power(values: List[float], t_start: float, t_end: float) -> float:
    duration = t_end - t_start
    if duration <= 0 or len(values) == 0:
        return 0.0
    dt = duration / len(values)
    return compute_energy(values, dt) / duration


# ─── Catalogue des signaux (équivalent Python de src/signals.ts) ──────────────


def _rect(t: float) -> float:
    return 1.0 if abs(t) < 0.5 else 0.0


def _tri(t: float) -> float:
    return 1.0 - abs(t) if abs(t) < 1.0 else 0.0


def _u(t: float) -> float:
    return 1.0 if t >= 0 else 0.0


def _ramp(t: float) -> float:
    return t if t > 0 else 0.0


def _delta_approx(t: float, t0: float, eps: float = 0.01) -> float:
    return (1.0 / (eps * math.sqrt(2 * math.pi))) * math.exp(-0.5 * ((t - t0) / eps) ** 2)


SIGNALS: Dict[str, Dict[str, Any]] = {
    "x1(t)":  {"func": lambda t: 2 * _rect(2 * t - 1),                            "duration": "finite"},
    "x2(t)":  {"func": lambda t: math.sin(math.pi * t) * _rect(t / 2),            "duration": "finite"},
    "x3(t)":  {"func": lambda t: _tri(2 * t),                                     "duration": "finite"},
    "x4(t)":  {"func": lambda t: _u(t - 2),                                       "duration": "infinite"},
    "x5(t)":  {"func": lambda t: 1.0 if t <= 3 else 0.0,                          "duration": "infinite"},
    "x6(t)":  {"func": lambda t: 2 * _delta_approx(t, -1) - _delta_approx(t, 2)
                                  + _delta_approx(t, 0) - 2 * _delta_approx(t, 1),
               "duration": "finite"},
    "x7(t)":  {"func": lambda t: _rect((t - 1) / 2) - _rect((t + 1) / 2),         "duration": "finite"},
    "x8(t)":  {"func": lambda t: _tri(t - 1) - _tri(t + 1),                       "duration": "finite"},
    "x9(t)":  {"func": lambda t: _rect(t / 2) - _tri(t),                          "duration": "finite"},
    "x10(t)": {"func": lambda t: math.exp(-t) * (1.0 if t >= 2 else 0.0),         "duration": "finite"},
    "x11(t)": {"func": lambda t: math.sin(4 * math.pi * t),                       "duration": "infinite"},
    "x12(t)": {"func": lambda t: _ramp(t + 1) - 2 * _ramp(t) + _ramp(t - 1),      "duration": "finite"},
}


def sample_signal(name: str, t_start: float, t_end: float, num: int = 1000) -> List[float]:
    sig = SIGNALS.get(name)
    if sig is None:
        raise ValueError(f"Signal inconnu: {name}")
    f = sig["func"]
    return [f(ti) for ti in linspace(t_start, t_end, num)]


# ─── Classification ───────────────────────────────────────────────────────────


def classify_signal(energy: float, avg_power: float, duration: str) -> str:
    if duration == "finite":
        return "Signal à énergie finie"
    if math.isfinite(avg_power):
        return "Signal à puissance moyenne finie"
    return "Signal à puissance infinie"


def analyze_all_signals(method: str = "trapeze",
                        t_start: float = -10.0,
                        t_end: float = 10.0,
                        num_points: int = 1000) -> List[Dict[str, Any]]:
    """Retourne pour chaque signal { signalName, energy, classification }."""
    results = []
    ts = linspace(t_start, t_end, num_points)
    dt = (t_end - t_start) / (num_points - 1)

    for name, sig in SIGNALS.items():
        try:
            f = sig["func"]
            duration = sig.get("duration", "infinite")
            values = [f(ti) for ti in ts]

            energy = compute_energy(values, dt, method) if duration == "finite" else float("inf")
            avg_p = average_power(values, t_start, t_end) if duration == "infinite" else 0.0
            classification = classify_signal(energy, avg_p, duration)

            results.append({
                "signalName": name,
                "energy": energy if math.isfinite(energy) else None,  # JSON-safe
                "energyIsInfinite": not math.isfinite(energy),
                "classification": classification,
            })
        except Exception as e:
            results.append({
                "signalName": name,
                "energy": None,
                "energyIsInfinite": False,
                "classification": f"Erreur: {e}",
            })
    return results


# ─── Calcul individuel (pour PowerCalculationView) ────────────────────────────


def energy_of_signal(name: str, t_start: float, t_end: float,
                     num_points: int = 1000, method: str = "trapeze") -> float:
    values = sample_signal(name, t_start, t_end, num_points)
    dt = (t_end - t_start) / (num_points - 1)
    return compute_energy(values, dt, method)


def power_of_signal(name: str, t_start: float, t_end: float,
                    num_points: int = 1000) -> float:
    values = sample_signal(name, t_start, t_end, num_points)
    return average_power(values, t_start, t_end)


# ─── TP2 : Transformée de Fourier numérique (FFT) ─────────────────────────────


def dft_signal(name: str, t_start: float, t_end: float, num_points: int = 1024) -> Dict[str, List[float]]:
    """
    DFT naïve O(N²) en pur Python (pas besoin de numpy). Suffisant pour N=512.
    Retourne fréquences, amplitude, phase, partie réelle/imaginaire.
    """
    if num_points > 1024:
        num_points = 1024  # garde-fou perf
    ts = linspace(t_start, t_end, num_points)
    dt = (t_end - t_start) / (num_points - 1)
    values = sample_signal(name, t_start, t_end, num_points)

    n = num_points
    freqs = [(k / (n * dt)) if k <= n // 2 else ((k - n) / (n * dt)) for k in range(n)]

    real = [0.0] * n
    imag = [0.0] * n
    for k in range(n):
        sr = 0.0
        si = 0.0
        ang_step = -2 * math.pi * k / n
        for j in range(n):
            ang = ang_step * j
            sr += values[j] * math.cos(ang)
            si += values[j] * math.sin(ang)
        real[k] = sr * dt
        imag[k] = si * dt

    amplitude = [math.hypot(real[k], imag[k]) for k in range(n)]
    phase = [math.atan2(imag[k], real[k]) for k in range(n)]

    # tri par fréquence croissante
    order = sorted(range(n), key=lambda k: freqs[k])
    return {
        "frequencies": [freqs[k] for k in order],
        "amplitude": [amplitude[k] for k in order],
        "phase": [phase[k] for k in order],
        "real": [real[k] for k in order],
        "imag": [imag[k] for k in order],
    }


# ─── Formatage ────────────────────────────────────────────────────────────────


def format_energy(energy) -> str:
    if energy is None or (isinstance(energy, float) and not math.isfinite(energy)):
        return "∞"
    if energy == 0:
        return "0"
    if abs(energy) < 1e-3 or abs(energy) > 1e3:
        return f"{energy:.3e}"
    return f"{energy:.3f}"


# ─── TP2 Exo 1 : Signal dent de scie ─────────────────────────────────────────

def sawtooth_value(t: float, period: float = 2.0) -> float:
    """Dent de scie 0→1 sur une période."""
    return t / period - math.floor(t / period)


def sawtooth_fourier_coeff(n: int) -> Dict[str, float]:
    """Coefficients complexes c_n pour dent de scie [0,1] de période T.
    c_0 = 1/2 ; c_n = j/(2πn) pour n != 0.
    """
    if n == 0:
        return {"re": 0.5, "im": 0.0, "mag": 0.5, "phase": 0.0}
    re = 0.0
    im = 1.0 / (2 * math.pi * n)
    mag = 1.0 / (2 * math.pi * abs(n))
    phase = math.atan2(im, re)
    return {"re": re, "im": im, "mag": mag, "phase": phase}


def sawtooth_reconstruct(t_start: float, t_end: float, num_points: int,
                         num_harmonics: int, period: float = 2.0) -> Dict[str, List[float]]:
    """Calcule x(t), reconstruction de Fourier sur N harmoniques, puissance num/anal."""
    w0 = 2 * math.pi / period
    ts = linspace(t_start, t_end, num_points)
    original = [sawtooth_value(t, period) for t in ts]
    reconstructed: List[float] = []
    for t in ts:
        s = 0.5
        for n in range(1, num_harmonics + 1):
            s += -math.sin(n * w0 * t) / (math.pi * n)
        reconstructed.append(s)
    return {"t": ts, "original": original, "reconstructed": reconstructed}


def sawtooth_spectrum(num_harmonics: int) -> List[Dict[str, float]]:
    out = []
    for n in range(-num_harmonics, num_harmonics + 1):
        c = sawtooth_fourier_coeff(n)
        out.append({"n": n, "amplitude": c["mag"], "phase": c["phase"] * 180.0 / math.pi})
    return out


def sawtooth_trigo_coeffs(num_harmonics: int) -> List[Dict[str, float]]:
    out = []
    for n in range(1, min(num_harmonics, 12) + 1):
        bn = -1.0 / (math.pi * n)
        an = 0.0
        An = 1.0 / (math.pi * n)
        out.append({"n": n, "a_n": an, "b_n": round(bn, 6), "A_n": round(An, 6), "phi_n": 90})
    return out


def sawtooth_power(num_harmonics: int) -> Dict[str, float]:
    """Puissance numérique (Parseval) et analytique (1/3)."""
    p = 0.25  # |c0|^2
    for n in range(1, num_harmonics + 1):
        p += 2 * (1.0 / (2 * math.pi * n)) ** 2
    return {"numeric": p, "analytic": 1.0 / 3.0}


# ─── TP2 Exo 2 : TF par propriétés (signaux x, x1..x4) ───────────────────────

def _sinc(x: float) -> float:
    if abs(x) < 1e-10:
        return 1.0
    return math.sin(math.pi * x) / (math.pi * x)


def _rect_tp2(t: float) -> float:
    a = abs(t)
    if a < 0.5:
        return 1.0
    if a == 0.5:
        return 0.5
    return 0.0


def _tri_tp2(t: float) -> float:
    return 1.0 - abs(t) if abs(t) < 1.0 else 0.0


_TP2_TIME = {
    "x":  lambda t: math.cos(6 * math.pi * t),
    "x1": lambda t: _tri_tp2(2 * t),
    "x2": lambda t: _rect_tp2((t - 1) / 2) - _rect_tp2((t + 1) / 2),
    "x3": lambda t: _tri_tp2(t - 1) - _tri_tp2(t + 1),
    "x4": lambda t: _rect_tp2(t / 2) - _tri_tp2(t),
}


def _tp2_amp(name: str, f: float) -> float:
    if name == "x":
        return 0.0
    if name == "x1":
        return 0.5 * _sinc(f / 2) ** 2
    if name == "x2":
        return 4 * abs(_sinc(2 * f) * math.sin(2 * math.pi * f))
    if name == "x3":
        return 2 * abs(_sinc(f) ** 2 * math.sin(2 * math.pi * f))
    if name == "x4":
        return abs(2 * _sinc(2 * f) - _sinc(f) ** 2)
    return 0.0


def _tp2_phase(name: str, f: float) -> float:
    if name in ("x", "x1"):
        return 0.0
    if name == "x2":
        val = _sinc(2 * f) * math.sin(2 * math.pi * f)
        if abs(val) < 1e-10:
            return 0.0
        return -90.0 if val > 0 else 90.0
    if name == "x3":
        val = (_sinc(f) ** 2) * math.sin(2 * math.pi * f)
        if abs(val) < 1e-10:
            return 0.0
        return -90.0 if val > 0 else 90.0
    if name == "x4":
        val = 2 * _sinc(2 * f) - _sinc(f) ** 2
        if abs(val) < 1e-10:
            return 0.0
        return 180.0 if val < 0 else 0.0
    return 0.0


def tp2_time_series(name: str, t_start: float, t_end: float, num_points: int) -> List[Dict[str, float]]:
    fn = _TP2_TIME[name]
    ts = linspace(t_start, t_end, num_points)
    return [{"t": round(t, 4), "value": fn(t)} for t in ts]


def tp2_freq_series(name: str, f_start: float, f_end: float, num_points: int) -> List[Dict[str, float]]:
    fs = linspace(f_start, f_end, num_points)
    return [{"f": round(f, 4), "amplitude": _tp2_amp(name, f), "phase": _tp2_phase(name, f)} for f in fs]


# ─── TP2 Exo 3 : Signal y(t) ─────────────────────────────────────────────────

def _y(t: float) -> float:
    if -1 <= t < 0:
        return -(t + 1)
    if 0 <= t <= 1:
        return 1 - t
    return 0.0


def _u_step(t: float) -> float:
    return 1.0 if t >= 0 else 0.0


def _y_block1(t: float) -> float:
    return -(t + 1) * (_u_step(t + 1) - _u_step(t))


def _y_block2(t: float) -> float:
    return (1 - t) * (_u_step(t) - _u_step(t - 1))


def _y_prime(t: float) -> float:
    if -1 < t < 0 or 0 < t < 1:
        return -1.0
    return 0.0


def _Y_imag(f: float) -> float:
    if abs(f) < 1e-6:
        return 0.0
    return (2 * math.sin(2 * math.pi * f) - 4 * math.pi * f) / (4 * math.pi * math.pi * f * f)


def y_time_series(t_start: float, t_end: float, num_points: int) -> List[Dict[str, float]]:
    ts = linspace(t_start, t_end, num_points)
    out = []
    for t in ts:
        out.append({
            "t": round(t, 4),
            "y": _y(t),
            "decomp": _y_block1(t) + _y_block2(t),
            "b1": _y_block1(t),
            "b2": _y_block2(t),
            "yp": _y_prime(t),
        })
    return out


def y_freq_series(f_start: float, f_end: float, num_points: int) -> List[Dict[str, float]]:
    fs = linspace(f_start, f_end, num_points)
    out = []
    for f in fs:
        im = _Y_imag(f)
        mag = abs(im)
        if abs(im) < 1e-9:
            phase = 0.0
        else:
            phase = (math.pi / 2) if im > 0 else -math.pi / 2
        out.append({
            "f": round(f, 4),
            "mag": mag,
            "phase": phase / math.pi,
            "im": im,
        })
    return out
