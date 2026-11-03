import { Link, NavLink } from 'react-router';
import { FlameIcon } from '@/shared/ui/icons';
import styles from './Navbar.module.css';

const LINKS = [
  { to: '/cards', label: 'Archive' },
  { to: '/characters', label: 'Characters' },
  { to: '/forge', label: 'Forge' },
] as const;

/** Site header: diamond logo, wordmark, tagline and the main links. */
export function Navbar() {
  return (
    <header className={styles.header}>
      <nav aria-label="Primary" className={styles.nav}>
        <Link to="/" className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            <FlameIcon />
          </span>
          <span className={styles.wordmark}>
            <span className={styles.name}>Bonfire Ledger</span>
            <span className={styles.tagline}>Unofficial companion</span>
          </span>
        </Link>
        <ul className={styles.links}>
          {LINKS.map(({ to, label }) => (
            <li key={to}>
              {/* NavLink sets aria-current="page" on the active link. */}
              <NavLink to={to} className={styles.link}>
                {label}
              </NavLink>
            </li>
          ))}
          <li>
            {/* Campaign isn't built yet; it points at the "Later" line on Home. */}
            <Link to="/#later" className={styles.link}>
              Campaign
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
