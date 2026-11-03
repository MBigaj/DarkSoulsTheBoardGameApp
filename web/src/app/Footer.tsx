import styles from './Footer.module.css';

/** Required on every page: the site is unofficial and credits the rights holders. */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span className={styles.name}>Bonfire Ledger</span>
        <p className={styles.credit}>
          Unofficial fan companion, not affiliated with the publishers. Dark Souls™ &amp; © Bandai
          Namco Entertainment Inc. / © FromSoftware, Inc. Board game by Steamforged Games.
        </p>
      </div>
    </footer>
  );
}
