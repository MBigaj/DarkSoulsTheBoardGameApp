import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/shared/api/api';
import type { ForgedEncounter } from '@/shared/api/types';
import level1 from '../../../test/fixtures/encounters/level-1.json';
import { ForgePage } from './ForgePage';

/**
 * The rail as wired by the page: what's clicked is what generateEncounter gets. Every forge returns
 * level-1 (2 tiles, Slay, no Trial, 2 players, SC), so a rail that copied the result would show it.
 */
const result = level1 as unknown as ForgedEncounter;

function renderForge() {
  const generate = vi.spyOn(api, 'generateEncounter').mockResolvedValue(result);
  vi.spyOn(api, 'getEncounter').mockResolvedValue(result);
  const router = createMemoryRouter(
    [
      { path: '/forge', Component: ForgePage },
      { path: '/forge/:id', Component: ForgePage },
    ],
    { initialEntries: ['/forge'] },
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  const rail = within(screen.getByRole('complementary', { name: 'Forge settings' }));
  const pick = (group: string, name: string) => {
    fireEvent.click(within(rail.getByRole('group', { name: group })).getByRole('button', { name }));
  };
  const forge = async () => {
    const calls = generate.mock.calls.length;
    fireEvent.click(rail.getByRole('button', { name: 'Forge encounter' }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/forge/${result.id}`);
    });
    // Settled: the button is back and the encounter on show has loaded.
    await rail.findByRole('button', { name: 'Forge encounter' });
    await screen.findByRole('img', { name: /^Map of 2 tiles/ });
    return generate.mock.calls[calls]?.[0];
  };
  return { rail, pick, forge };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Forge page: the request matches the rail', () => {
  it('By difficulty sends level, party and pool as clicked', async () => {
    const { rail, pick, forge } = renderForge();
    fireEvent.click(rail.getByRole('button', { name: /^Level I · Wandering/ }));
    pick('Party size', '1');
    fireEvent.click(rail.getByRole('button', { name: 'Tomb of Giants' }));
    fireEvent.click(rail.getByRole('button', { name: 'Sunless City' }));

    expect(await forge()).toEqual({ mode: 'difficulty', level: 1, partySize: 1, sets: ['pwa'] });
  });

  it('Custom values survive a forge and switching mode twice', async () => {
    const { rail, pick, forge } = renderForge();
    fireEvent.click(rail.getByRole('button', { name: 'Custom' }));
    pick('Tiles', '4');
    pick('Encounter level', 'Level III');
    pick('Party size', '4');
    pick('Objective', 'Exit');
    fireEvent.click(rail.getByRole('button', { name: 'Add a Trial' }));

    const first = await forge();
    expect(first).toEqual({
      mode: 'custom',
      level: 3,
      partySize: 4,
      sets: ['tog', 'pwa', 'sc'],
      tiles: 4,
      objective: 'exit',
      trial: true,
    });

    fireEvent.click(rail.getByRole('button', { name: 'By difficulty' }));
    fireEvent.click(rail.getByRole('button', { name: 'Custom' }));
    expect(await forge()).toEqual(first);
  });
});
