import { Outlet } from 'react-router';

// Placeholder until the AppShell (navbar, footer) lands in FE-06.
export function RootLayout() {
  return (
    <main>
      <Outlet />
    </main>
  );
}
