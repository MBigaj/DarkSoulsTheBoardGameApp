import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { ArchivePage } from './ArchivePage';

/** Component test 1 (plan): rail → active chip → remove chip → filter cleared; URL at each step. */
function renderArchive(path: string) {
  const router = createMemoryRouter(
    [
      { path: '/cards', Component: ArchivePage },
      { path: '/cards/:type', Component: ArchivePage },
    ],
    { initialEntries: [path] },
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  const search = () => new URLSearchParams(router.state.location.search);
  return { search };
}

describe('filter rail and active chips', () => {
  it('a rail filter adds a chip; removing the chip clears the filter and the URL', async () => {
    const { search } = renderArchive('/cards/encounters?card=tog-encounter-lakeview-refuge');

    const traps = await screen.findByRole('button', { name: 'Traps' });
    expect(traps).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('button', { name: /^Remove filter/ })).toBeNull();

    fireEvent.click(traps);
    expect(search().get('includes')).toBe('traps');
    expect(traps).toHaveAttribute('aria-pressed', 'true');
    const chip = screen.getByRole('button', { name: 'Remove filter Traps' });

    fireEvent.click(screen.getByRole('button', { name: 'II' }));
    expect(search().get('level')).toBe('2');
    expect(screen.getByRole('button', { name: 'Remove filter Level: II' })).toBeInTheDocument();

    fireEvent.click(chip);
    await waitFor(() => {
      expect(search().get('includes')).toBeNull();
    });
    expect(screen.getByRole('button', { name: 'Traps' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('button', { name: 'Remove filter Traps' })).toBeNull();
    // The other filter and unrelated params stay.
    expect(search().get('level')).toBe('2');
    expect(search().get('card')).toBe('tog-encounter-lakeview-refuge');
  });

  it('Clear all removes every chip: sets, search and the type filters', async () => {
    const { search } = renderArchive('/cards/encounters?set=tog&q=lake&includes=trial');

    expect(
      await screen.findByRole('button', { name: 'Remove filter Hide SC' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove filter “lake”' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    await waitFor(() => {
      expect(search().toString()).toBe('');
    });
    expect(screen.queryByRole('button', { name: /^Remove filter/ })).toBeNull();
  });
});
