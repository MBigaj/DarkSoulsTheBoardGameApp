import type { CardType } from '@/shared/lib/card-types';
import { cx } from '@/shared/lib/cx';
import styles from './CardFace.module.css';

type CardFaceProps = {
  name: string;
  type: CardType;
  /** Card image; without it the face shows the placeholder (name + hatched art slot). */
  src?: string;
  srcSet?: string;
  sizes?: string;
  /** Empty by default: the face usually sits inside a control that already names the card. */
  alt?: string;
  className?: string;
};

/**
 * The card face only, in its printed shape with rounded corners.
 * Type badge, ID and stat line belong to the tile around it.
 */
export function CardFace({ name, type, src, srcSet, sizes, alt = '', className }: CardFaceProps) {
  return (
    <span className={cx(styles.face, styles[type], className)}>
      {src ? (
        <img
          className={styles.image}
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      ) : (
        <span className={styles.placeholder}>
          <span className={styles.name}>{name}</span>
          <span className={styles.art} aria-hidden="true">
            Card art
          </span>
        </span>
      )}
    </span>
  );
}
