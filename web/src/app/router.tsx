import { createBrowserRouter, type RouteObject } from 'react-router';
import { RootLayout } from './RootLayout';

// One lazy chunk per route. AppShell, NotFound and the other pages arrive in later tasks.
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        lazy: async () => {
          const { HomePage } = await import('@/features/home/HomePage');
          return { Component: HomePage };
        },
      },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
