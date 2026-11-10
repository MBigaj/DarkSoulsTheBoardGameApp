import { useState } from 'react';
import { cardImageSources } from '@/shared/lib/card-image';

type StoreImageProps = {
  /** Path inside the store's images/ folder, e.g. "tiles/sc/3a.png" or "sc/boss/executioner-smough.png". */
  art: string;
  alt?: string;
  /** CSS width the image renders at; picks the 300w file or the full one. */
  sizes: string;
  /** Intrinsic size, so the browser knows the shape before the file arrives. */
  width: number;
  height: number;
  /** Above the fold: load now instead of lazily. */
  priority?: boolean;
  className?: string;
};

/**
 * Any image from the data store (tiles, boss cards…), served as the WebP that build-images makes.
 * No art is committed to the repo; where the store isn't present (CI, the production image)
 * the file is missing and the image renders nothing instead of a broken icon.
 */
export function StoreImage({
  art,
  alt = '',
  sizes,
  width,
  height,
  priority = false,
  className,
}: StoreImageProps) {
  const [failed, setFailed] = useState(false);
  const sources = cardImageSources(art);
  if (!sources || failed) return null;
  return (
    <img
      className={className}
      src={sources.src}
      srcSet={sources.srcSet}
      sizes={sizes}
      width={width}
      height={height}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      onError={() => {
        setFailed(true);
      }}
    />
  );
}
