import { useEffect, useState } from 'react';
import { loadPyodideOnce } from '@/lib/pyodideRuntime';

interface PyodideState {
  ready: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Hook React : lance le chargement de Pyodide au montage et expose l'état.
 * Utilisé par les composants TP qui délèguent leurs calculs au runtime Python.
 */
export function usePyodide(): PyodideState {
  const [state, setState] = useState<PyodideState>({
    ready: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    loadPyodideOnce()
      .then(() => {
        if (!cancelled) setState({ ready: true, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled)
          setState({
            ready: false,
            loading: false,
            error: err instanceof Error ? err.message : String(err),
          });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
