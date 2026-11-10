import { cx } from '@/shared/lib/cx';
import { Frame } from '@/shared/ui/Frame';
import { StoreImage } from '@/shared/ui/StoreImage';
import { HERO_FAN, HERO_TILE } from './content';
import styles from './HeroArt.module.css';

/**
 * Hero key art (HomeFinal): a dimmed, blurred game tile with five cards fanned in front.
 * Decorative: the heading and buttons above say what the page is.
 */
export function HeroArt({ className }: { className?: string }) {
  return (
    <Frame aria-hidden="true" className={cx(styles.art, className)}>
      <StoreImage
        className={styles.backdrop}
        art={HERO_TILE}
        sizes="(max-width: 760px) 100vw, 760px"
        width={1000}
        height={1000}
        priority
      />
      <span className={styles.shade} />
      {HERO_FAN.map(({ art, shape }, i) => (
        <StoreImage
          key={art}
          className={cx(styles.card, styles[shape], styles[`fan${String(i)}`])}
          art={art}
          sizes="(max-width: 760px) 30vw, 230px"
          width={shape === 'boss' ? 611 : 571}
          height={850}
          priority
        />
      ))}
    </Frame>
  );
}
