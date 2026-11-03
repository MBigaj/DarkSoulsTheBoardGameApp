import { createBrowserRouter, type RouteObject } from 'react-router';
import { AppShell } from './AppShell';
import { NotFound } from './NotFound';
import { RouteError } from './RouteError';

// One lazy chunk per page. The Archive, Characters and Forge routes arrive with their milestones.
const pages: RouteObject[] = [
  {
    index: true,
    lazy: async () => {
      const { HomePage } = await import('@/features/home/HomePage');
      return { Component: HomePage };
    },
  },
  // Dev-only style sheet; the branch is dropped from production builds.
  ...(import.meta.env.DEV
    ? [
        {
          path: 'style',
          lazy: async () => {
            const { StylePage } = await import('@/features/style/StylePage');
            return { Component: StylePage };
          },
        },
      ]
    : []),
  { path: '*', Component: NotFound },
];

export const routes: RouteObject[] = [
  {
    path: '/',
    Component: AppShell,
    // A pathless child holds the error boundary, so errors render inside the shell.
    children: [{ errorElement: <RouteError />, children: pages }],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
