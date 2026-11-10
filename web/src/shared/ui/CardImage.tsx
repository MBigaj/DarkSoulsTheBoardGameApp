import type { SyntheticEvent } from 'react';
import { imageUrl } from '@/shared/lib/card-image';

/** Printed treasure card size; the parent's box sets each type's real shape. */
const WIDTH = 571;
const HEIGHT = 850;

type CardImageProps = {
  /** Card `art` path from the data, e.g. "tog/treasure/fireball.png". */
  art: string;
  /** Empty by default: the image usually sits inside a control that already names the card. */
  alt?: string;
  /** Above the fold (the close-up): load now, at high priority, instead of lazily. */
  priority?: boolean;
  className?: string;
  onLoad?: (event: SyntheticEvent<HTMLImageElement>) => void;
  onError?: (event: SyntheticEvent<HTMLImageElement>) => void;
};

/**
 * A card scan from the store. Width/height give the browser the card's shape before the file
 * arrives; the parent's aspect-ratio box holds the space, so nothing shifts.
 */
export function CardImage({
  art,
  alt = '',
  priority = false,
  className,
  onLoad,
  onError,
}: CardImageProps) {
  const src = imageUrl(art);
  if (!src) return null;
  return (
    <img
      className={className}
      src={src}
      width={WIDTH}
      height={HEIGHT}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      draggable={false}
      onLoad={onLoad}
      onError={onError}
    />
  );
}
