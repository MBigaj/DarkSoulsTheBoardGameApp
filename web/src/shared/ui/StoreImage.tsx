import { useState } from 'react';
import { imageUrl } from '@/shared/lib/card-image';

type StoreImageProps = {
  /** Path inside the store's images/ folder, e.g. "tiles/sc/3a.png" or "sc/boss/executioner-smough.png". */
  art: string;
  alt?: string;
  /** Intrinsic size, so the browser knows the shape before the file arrives. */
  width: number;
  height: number;
  /** Above the fold: load now instead of lazily. */
  priority?: boolean;
  className?: string;
};

/**
 * Any image from the data store (tiles, boss cards…). No art is committed to the repo; where the
 * store isn't mounted (CI) the file is missing and the image renders nothing, not a broken icon.
 */
export function StoreImage({
  art,
  alt = '',
  width,
  height,
  priority = false,
  className,
}: StoreImageProps) {
  const [failed, setFailed] = useState(false);
  const src = imageUrl(art);
  if (!src || failed) return null;
  return (
    <img
      className={className}
      src={src}
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
