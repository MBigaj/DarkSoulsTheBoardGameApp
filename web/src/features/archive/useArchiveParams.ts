import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import type { KeepFocusState } from '@/app/AppShell';
import { readParams, writeParams } from '@/shared/lib/url-state';
import { commonFields, type CommonFilters } from './filters';

const KEEP: KeepFocusState = { keepFocus: true };

/** Set, search and sort from the URL, and a setter that rewrites only those params. */
export function useCommonFilters() {
  const [params, setParams] = useSearchParams();
  const common = readParams(commonFields, params);
  const setCommon = useCallback(
    (values: Partial<CommonFilters>) => {
      setParams((current) => writeParams(commonFields, values, current), {
        replace: true,
        preventScrollReset: true,
        state: KEEP,
      });
    },
    [setParams],
  );
  return { params, common, setCommon };
}
