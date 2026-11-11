import { useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import type { KeepFocusState } from '@/app/AppShell';
import { readParams, writeParams, type Fields, type Values } from '@/shared/lib/url-state';
import { commonFields, type CommonFilters } from './filters';

const KEEP: KeepFocusState = { keepFocus: true };

type FieldValues = Record<string, unknown>;
export type Update = FieldValues | ((latest: FieldValues) => FieldValues);

/**
 * Set, search and sort from the URL, plus setters that rewrite only the given fields' params
 * (history replaced, scroll and focus kept).
 */
export function useCommonFilters() {
  const [params, setParams] = useSearchParams();
  // Each write builds on the previous one: two writes before the next render (two quick clicks,
  // "Clear all") would otherwise both start from the same old URL and the first would be lost.
  const latest = useRef(params);
  useEffect(() => {
    latest.current = params;
  }, [params]);

  /** `values`, or a function of the fields' latest values (for toggles: two quick clicks). */
  const write = useCallback(
    (fields: Fields, update: Update) => {
      const values =
        typeof update === 'function' ? update(readParams(fields, latest.current)) : update;
      const next = writeParams(fields, values as Partial<Values<Fields>>, latest.current);
      latest.current = next;
      setParams(next, { replace: true, preventScrollReset: true, state: KEEP });
    },
    [setParams],
  );
  const common = readParams(commonFields, params);
  const setCommon = useCallback(
    (values: Partial<CommonFilters>) => {
      write(commonFields, values);
    },
    [write],
  );
  return { params, common, setCommon, write };
}
