import type { SyntheticEvent } from 'react';
import { cardImageSources } from '@/shared/lib/card-image';
import { CARD_IMAGE } from '@/shared/lib/card-image-sizes';

/** Archive tiles: two columns on phones, ~150–176px cells otherwise. */
export const TILE_SIZES = '(max-width: 480px) 45vw, 176px';

type CardImageProps = {
  /** Card `art` path from the data, e.g. "tog/treasure/fireball.png". */
  art: string;
  /** Empty by default: the image usually sits inside a control that already names the card. */
  alt?: string;
  /** CSS width the image renders at; picks the 300w tile or the full file. */
  sizes?: string;
  /** Above the fold (the close-up): load now, at high priority, instead of lazily. */
  priority?: boolean;
  className?: string;
  onLoad?: (event: SyntheticEvent<HTMLImageElement>) => void;
  onError?: (event: SyntheticEvent<HTMLImageElement>) => void;
};

/**
 * A card scan as generated WebP, with srcset. Width/height give the browser the card's shape
 * before the file arrives; the parent's aspect-ratio box holds the space, so nothing shifts.
 */
export function CardImage({
  art,
  alt = '',
  sizes = TILE_SIZES,
  priority = false,
  className,
  onLoad,
  onError,
}: CardImageProps) {
  const sources = cardImageSources(art);
  if (!sources) return null;
  return (
    <img
      className={className}
      src={sources.src}
      srcSet={sources.srcSet}
      sizes={sizes}
      width={CARD_IMAGE.fullWidth}
      height={CARD_IMAGE.fullHeight}
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
