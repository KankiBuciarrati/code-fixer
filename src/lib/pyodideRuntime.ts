/**
 * Loader Pyodide : charge l'interpréteur Python (~10 Mo, mis en cache navigateur)
 * et le module signal_analysis.py depuis /public/python/.
 *
 * Singleton — chargé une seule fois pour toute l'app.
 */

const PYODIDE_VERSION = '0.26.4';
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

declare global {
  interface Window {
    loadPyodide?: (config?: { indexURL: string }) => Promise<PyodideInterface>;
  }
}

export interface PyodideInterface {
  runPython: (code: string) => unknown;
  runPythonAsync: (code: string) => Promise<unknown>;
  globals: {
    get: (name: string) => unknown;
    set: (name: string, value: unknown) => void;
  };
  toPy: (obj: unknown) => unknown;
}

let pyodidePromise: Promise<PyodideInterface> | null = null;

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export async function loadPyodideOnce(): Promise<PyodideInterface> {
  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = (async () => {
    await injectScript(`${PYODIDE_CDN}pyodide.js`);
    if (!window.loadPyodide) {
      throw new Error('Pyodide loader not available on window');
    }
    const py = await window.loadPyodide({ indexURL: PYODIDE_CDN });

    // Charge le module Python depuis /public/python/signal_analysis.py
    const res = await fetch('/python/signal_analysis.py');
    if (!res.ok) throw new Error('Could not fetch signal_analysis.py');
    const code = await res.text();
    py.runPython(code);

    return py;
  })();

  return pyodidePromise;
}

/**
 * Helper : appelle une fonction Python définie globalement, retourne du JS pur.
 * Les arguments doivent être JSON-sérialisables (number, string, array, object).
 */
export async function callPython<T = unknown>(
  funcName: string,
  args: unknown[] = []
): Promise<T> {
  const py = await loadPyodideOnce();
  py.globals.set('__js_args', py.toPy(args));
  const code = `
import json
__result = ${funcName}(*__js_args.to_py())
json.dumps(__result, default=lambda o: None)
`;
  const jsonStr = py.runPython(code) as string;
  return JSON.parse(jsonStr) as T;
}
