import { useEffect, useRef, useState, type RefObject } from 'react';
import type { ForgedEncounter } from '@/shared/api/types';
import { imageUrl } from '@/shared/lib/card-image';
import styles from './EncounterMap.module.css';
import { connectors, mapGrid, markers, tileArt, tileLabel, type Marker } from './mapLayout';

/** SVG units per tile side. A marker is 15% of the tile wide (handoff). */
const SIDE = 600;
const RADIUS = SIDE * 0.075;
const DOOR = SIDE * 0.15;
/** Widest a tile gets, and the gap track between tiles (ForgeFinal). */
const TILE_MAX = 270;

/**
 * Marker label size, one for every label: 10px at the smallest art the map allows (168px, see
 * `--tile-min`), and four characters ("8,10") still fit inside the marker.
 */
const LABEL = 36;

/** True while the element is wider than its box, i.e. it scrolls sideways. */
function useScrolls(ref: RefObject<HTMLElement | null>): boolean {
  const [scrolls, setScrolls] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const check = () => {
      setScrolls(el.scrollWidth > el.clientWidth + 1);
    };
    const observer = new ResizeObserver(check);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => {
      observer.disconnect();
    };
  }, [ref]);
  return scrolls;
}

function NodeMarker({ marker }: { marker: Marker }) {
  const x = marker.x * SIDE;
  const y = marker.y * SIDE;
  const shape = (className: string | undefined) =>
    marker.kind === 'doorway' ? (
      <rect
        x={x - DOOR / 2}
        y={y - DOOR / 2}
        width={DOOR}
        height={DOOR}
        rx={DOOR * 0.12}
        className={className}
      />
    ) : (
      <circle cx={x} cy={y} r={RADIUS} className={className} />
    );
  return (
    <g className={styles.marker} data-kind={marker.kind}>
      {shape(styles.shadow)}
      {shape(styles.shape)}
      {marker.label && (
        <text x={x} y={y} className={styles.label} fontSize={LABEL}>
          {marker.label}
        </text>
      )}
    </g>
  );
}

/**
 * The forged map (ForgeFinal): real tile art turned by `turns`, on a grid in play order, with a
 * doorway connector between joined tiles and the nodes drawn over the printed ones. One picture
 * to assistive tech; the roster beside it lists what's on each tile. Tiles keep a readable
 * minimum; when the panel is narrower, the map scrolls sideways in its own box (focusable while it
 * scrolls) and the page never does.
 */
export function EncounterMap({ encounter }: { encounter: ForgedEncounter }) {
  const scroller = useRef<HTMLDivElement>(null);
  const scrolls = useScrolls(scroller);
  const grid = mapGrid(encounter.tiles);
  const marks = markers(encounter);
  const starts = encounter.tiles.flatMap((t) => t.nodes).filter((n) => n.kind === 'start');
  const columns = Array.from({ length: grid.columns }, () => 'minmax(var(--tile-min), 1fr)').join(
    ' var(--map-gap) ',
  );
  // Per map row: header, art; a gap row between map rows.
  const rows = Array.from({ length: grid.rows }, () => 'auto auto').join(' var(--map-gap) ');
  const count = (n: number, one: string, many: string) => `${String(n)} ${n === 1 ? one : many}`;

  return (
    <div
      ref={scroller}
      className={styles.scroller}
      tabIndex={scrolls ? 0 : undefined}
      role={scrolls ? 'region' : undefined}
      aria-label={scrolls ? 'Encounter map, scrolls sideways' : undefined}
    >
      <div
        role="img"
        aria-label={`Map of ${count(encounter.tiles.length, 'tile', 'tiles')} joined by doorways: ${count(encounter.enemies.length, 'enemy', 'enemies')}, ${count(encounter.terrain.length, 'terrain token', 'terrain tokens')}, ${count(starts.length, 'character start', 'character starts')}.`}
        className={styles.map}
        style={{
          gridTemplateColumns: columns,
          gridTemplateRows: rows,
          maxWidth: `calc(${String(grid.columns * TILE_MAX)}px + ${String(grid.columns - 1)} * var(--map-gap))`,
        }}
      >
        {encounter.tiles.map((tile) => {
          const cell = grid.cells.get(tile.tile);
          const art = imageUrl(tileArt(tile.tileId));
          const tag =
            tile.tile === 1 ? 'Start' : tile.nodes.some((n) => n.kind === 'exit') ? 'Exit' : null;
          return (
            <div
              key={tile.tile}
              className={styles.tile}
              style={{
                gridColumn: cell?.column,
                gridRow: cell ? `${String(cell.row)} / span 2` : undefined,
              }}
            >
              <div className={styles.head}>
                <span>
                  T<span className={styles.long}>ile </span>
                  {tile.tile} · {tileLabel(tile.tileId)}
                </span>
                {tag && (
                  <span className={styles.tag} data-tag={tag}>
                    {tag}
                  </span>
                )}
              </div>
              <div className={styles.art}>
                {art && (
                  <img
                    src={art}
                    alt=""
                    width={1000}
                    height={1000}
                    decoding="async"
                    className={styles.image}
                    style={{ transform: `rotate(${String(tile.turns * 90)}deg)` }}
                  />
                )}
                <svg viewBox={`0 0 ${String(SIDE)} ${String(SIDE)}`} className={styles.nodes}>
                  {(marks.get(tile.tile) ?? []).map((marker) => (
                    <NodeMarker key={`${String(marker.x)},${String(marker.y)}`} marker={marker} />
                  ))}
                </svg>
              </div>
            </div>
          );
        })}
        {connectors(encounter).map((link) => (
          <div
            key={`${String(link.column)},${String(link.row)}`}
            className={styles.connector}
            data-axis={link.axis}
            style={{ gridColumn: link.column, gridRow: link.row }}
          />
        ))}
      </div>
    </div>
  );
}
