import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/shared/api/api';
import type { ForgedEncounter } from '@/shared/api/types';
import level1 from '../../../test/fixtures/encounters/level-1.json';
import { EncounterResult } from './EncounterResult';

const encounter = level1 as unknown as ForgedEncounter;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('EncounterResult roster', () => {
  it('a failed catalog ends in readable names and a note, never an endless "Loading…"', async () => {
    vi.spyOn(api, 'listCards').mockRejectedValue(new Error('offline'));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <EncounterResult encounter={encounter} />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Enemy details couldn't be loaded.")).toBeInTheDocument();
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
    expect(screen.getAllByText('Hollow soldier')).toHaveLength(2);
    expect(screen.queryByText(/Threat/)).not.toBeInTheDocument();
  });
});
