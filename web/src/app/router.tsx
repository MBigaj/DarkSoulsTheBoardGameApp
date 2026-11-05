import { createBrowserRouter, type RouteObject } from 'react-router';
import { AppShell } from './AppShell';
import { NotFound } from './NotFound';
import { RouteError } from './RouteError';

const archive = async () => {
  const { ArchivePage } = await import('@/features/archive/ArchivePage');
  return { Component: ArchivePage };
};
const forge = async () => {
  const { ForgePage } = await import('@/features/forge/ForgePage');
  return { Component: ForgePage };
};

// One lazy chunk per page. Archive, Characters and Forge are placeholders until their milestones.
const pages: RouteObject[] = [
  {
    index: true,
    lazy: async () => {
      const { HomePage } = await import('@/features/home/HomePage');
      return { Component: HomePage };
    },
  },
  { path: 'cards', lazy: archive },
  { path: 'cards/:type', lazy: archive },
  {
    path: 'characters',
    lazy: async () => {
      const { BuilderPage } = await import('@/features/characters/BuilderPage');
      return { Component: BuilderPage };
    },
  },
  { path: 'forge', lazy: forge },
  { path: 'forge/:id', lazy: forge },
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
