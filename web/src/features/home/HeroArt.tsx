import { cx } from '@/shared/lib/cx';
import { Frame } from '@/shared/ui/Frame';
import { HERO_FAN, heroTile } from './content';
import styles from './HeroArt.module.css';

/**
 * Hero key art (HomeFinal): a dimmed, blurred game tile with five cards fanned in front.
 * Decorative: the heading and buttons above say what the page is.
 */
export function HeroArt({ className }: { className?: string }) {
  return (
    <Frame aria-hidden="true" className={cx(styles.art, className)}>
      <img className={styles.backdrop} src={heroTile} alt="" width={720} height={720} />
      <span className={styles.shade} />
      {HERO_FAN.map(({ src, shape }) => (
        <img
          key={src}
          className={cx(styles.card, styles[shape])}
          src={src}
          alt=""
          width={560}
          height={shape === 'boss' ? 779 : 834}
          decoding="async"
          draggable={false}
        />
      ))}
    </Frame>
  );
}
