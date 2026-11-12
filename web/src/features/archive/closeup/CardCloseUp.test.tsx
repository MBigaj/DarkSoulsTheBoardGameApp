import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { ArchivePage } from '../ArchivePage';

/** Component test 2 (plan): Esc closes and focus returns to the tile; ←/→ turn the card. */
function renderArchive(path: string) {
  const router = createMemoryRouter([{ path: '/cards/:type', Component: ArchivePage }], {
    initialEntries: [path],
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { search: () => new URLSearchParams(router.state.location.search) };
}

describe('card close-up', () => {
  it('opens from a tile, turns with ←/→, and Esc closes it with focus back on the tile', async () => {
    const { search } = renderArchive('/cards/treasure?deck=starter');
    const tile = await screen.findByRole('link', { name: 'Bandit Knife' });
    tile.focus();
    fireEvent.click(tile);

    const dialog = await screen.findByRole('dialog', { name: 'Bandit Knife close-up' });
    expect(search().get('card')).toBe('tog-treasure-bandit-knife');
    expect(search().get('deck')).toBe('starter'); // the filters stay
    const close = screen.getByRole('button', { name: 'Close' });
    expect(close).toHaveFocus();
    expect(dialog).toHaveTextContent('showing the front');

    // → turns right, ← back left: the card goes round the way the key points.
    const turnedTo = () => dialog.querySelector<HTMLElement>('[data-type]')?.style.transform;
    fireEvent.keyDown(close, { key: 'ArrowRight' });
    expect(dialog).toHaveTextContent('showing the back');
    expect(turnedTo()).toBe('rotateX(0deg) rotateY(180deg)');
    fireEvent.keyDown(close, { key: 'ArrowLeft' });
    expect(dialog).toHaveTextContent('showing the front');
    fireEvent.keyDown(close, { key: 'ArrowLeft' });
    expect(dialog).toHaveTextContent('showing the back');
    expect(turnedTo()).toBe('rotateX(0deg) rotateY(-180deg)');

    fireEvent.keyDown(close, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(search().get('card')).toBeNull();
    expect(search().get('deck')).toBe('starter');
    expect(screen.getByRole('link', { name: 'Bandit Knife' })).toHaveFocus();
  });

  it('a deep link opens it; Close drops ?card= and keeps the rest', async () => {
    const { search } = renderArchive('/cards/events?card=pwa-event-fleeting-glory&set=pwa');
    await screen.findByRole('dialog', { name: 'Fleeting Glory close-up' });
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(search().toString()).toBe('set=pwa');
  });
});
