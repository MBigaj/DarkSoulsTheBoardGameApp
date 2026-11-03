import { Outlet } from 'react-router';
import { Footer } from './Footer';
import { Navbar } from './Navbar';
import styles from './AppShell.module.css';

/** Navbar, the routed page in <main>, footer. Route errors render inside <main> too. */
export function AppShell() {
  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skip}>
        Skip to content
      </a>
      <Navbar />
      <main id="main" tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
