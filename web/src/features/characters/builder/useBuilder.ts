import { useEffect, useReducer } from 'react';
import { builderReducer, initialBuilder, parseBuilder, type BuilderState } from './builderReducer';

/** localStorage key; bump the version when the saved shape changes. */
const KEY = 'bonfire-ledger:builder:v1';

/** The saved party, or the default one. Storage can be missing or throw (private mode): then no saving. */
function load(): BuilderState {
  try {
    const saved = localStorage.getItem(KEY);
    return (saved !== null && parseBuilder(JSON.parse(saved))) || initialBuilder();
  } catch {
    return initialBuilder();
  }
}

/** Builder state, kept in localStorage so a reload restores the party (a convenience, not a save). */
export function useBuilder() {
  const [state, dispatch] = useReducer(builderReducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Full or blocked: the party just won't survive a reload.
    }
  }, [state]);
  return [state, dispatch] as const;
}
