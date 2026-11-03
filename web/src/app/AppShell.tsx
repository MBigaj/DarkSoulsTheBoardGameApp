import { useEffect, useRef } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router';
import { Footer } from './Footer';
import { Navbar } from './Navbar';
import styles from './AppShell.module.css';

/** Navigation that should keep focus where it is (e.g. archive tabs) passes this in `state`. */
export type KeepFocusState = { keepFocus?: boolean };

/** Navbar, the routed page in <main>, footer. Route errors render inside <main> too. */
export function AppShell() {
  const location = useLocation();
  const { pathname } = location;
  const keepFocus = (location.state as KeepFocusState | null)?.keepFocus === true;
  const mainRef = useRef<HTMLElement>(null);
  const shownPath = useRef(pathname);

  // Client-side navigation is silent to screen readers; moving focus to <main> on a new page
  // announces it and puts keyboard users at the start of the content. Not on the first load.
  useEffect(() => {
    // Compared with the last path rather than a first-render flag, so StrictMode's double effect is a no-op.
    if (shownPath.current === pathname) return;
    shownPath.current = pathname;
    if (keepFocus) return;
    // ScrollRestoration owns the scroll position (hash target, top, or restored).
    mainRef.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a new page moves focus, not new state
  }, [pathname]);

  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skip}>
        Skip to content
      </a>
      <Navbar />
      <main id="main" ref={mainRef} tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      <Footer />
      {/* Scrolls to location.hash when present, else to the top; restores on back/forward. */}
      <ScrollRestoration />
    </div>
  );
}
