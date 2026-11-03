import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { Providers } from './Providers';
import { routes } from './router';

describe('router', () => {
  it('renders the placeholder home route at /', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/'] });
    render(
      <Providers>
        <RouterProvider router={router} />
      </Providers>,
    );
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Bonfire Ledger' }),
    ).toBeInTheDocument();
  });
});
