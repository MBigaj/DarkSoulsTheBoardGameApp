import { useState } from 'react';
import type { CardType } from '@/shared/lib/card-types';
import { cx } from '@/shared/lib/cx';
import { CardImage } from './CardImage';
import styles from './CardFace.module.css';

type CardFaceProps = {
  name: string;
  type: CardType;
  /** Card `art` path. Without it, or if the file fails to load, the face shows the placeholder. */
  art?: string | null;
  priority?: boolean;
  /** Empty by default: the face usually sits inside a control that already names the card. */
  alt?: string;
  className?: string;
};

/**
 * The card face only, in its printed shape with rounded corners.
 * Type badge, ID and stat line belong to the tile around it.
 */
export function CardFace({ name, type, art, priority, alt, className }: CardFaceProps) {
  return (
    <span className={cx(styles.face, styles[type], className)}>
      {art ? (
        // Keyed by art, so a new card starts fresh instead of inheriting the last one's state.
        <FaceImage key={art} name={name} art={art} priority={priority} alt={alt} />
      ) : (
        <Placeholder name={name} />
      )}
    </span>
  );
}

function FaceImage({
  name,
  art,
  priority,
  alt,
}: {
  name: string;
  art: string;
  priority?: boolean;
  alt?: string;
}) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');
  // A missing file (e.g. no store mounted) falls back to the placeholder, never a broken icon.
  if (status === 'failed') return <Placeholder name={name} />;
  return (
    <CardImage
      art={art}
      priority={priority}
      alt={alt}
      className={cx(styles.image, status === 'loaded' && styles.loaded)}
      onLoad={() => {
        setStatus('loaded');
      }}
      onError={() => {
        setStatus('failed');
      }}
    />
  );
}

function Placeholder({ name }: { name: string }) {
  return (
    <span className={styles.placeholder}>
      <span className={styles.name}>{name}</span>
      <span className={styles.art} aria-hidden="true">
        Card art
      </span>
    </span>
  );
}
