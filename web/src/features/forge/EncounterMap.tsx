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

/** Smaller type for longer labels ("1,2,3"), so they stay inside the marker. */
const labelSize = (label: string) => (label.length <= 1 ? 32 : label.length <= 3 ? 26 : 21);

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
        <text x={x} y={y} className={styles.label} fontSize={labelSize(marker.label)}>
          {marker.label}
        </text>
      )}
    </g>
  );
}

/**
 * The forged map (ForgeFinal): real tile art turned by `turns`, on a grid in play order, with a
 * doorway connector between joined tiles and the nodes drawn over the printed ones. One picture
 * to assistive tech; the roster beside it lists what's on each tile.
 */
export function EncounterMap({ encounter }: { encounter: ForgedEncounter }) {
  const grid = mapGrid(encounter.tiles);
  const marks = markers(encounter);
  const starts = encounter.tiles.flatMap((t) => t.nodes).filter((n) => n.kind === 'start');
  const tracks = (n: number, size: string) =>
    Array.from({ length: n * 2 - 1 }, (_, i) => (i % 2 === 0 ? size : 'var(--map-gap)')).join(' ');
  const count = (n: number, one: string, many: string) => `${String(n)} ${n === 1 ? one : many}`;

  return (
    <div
      role="img"
      aria-label={`Map of ${count(encounter.tiles.length, 'tile', 'tiles')} joined by doorways: ${count(encounter.enemies.length, 'enemy', 'enemies')}, ${count(encounter.terrain.length, 'terrain token', 'terrain tokens')}, ${count(starts.length, 'character start', 'character starts')}.`}
      className={styles.map}
      style={{
        gridTemplateColumns: tracks(grid.columns, 'minmax(0, 1fr)'),
        gridTemplateRows: tracks(grid.rows, 'auto'),
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
            style={{ gridColumn: cell?.column, gridRow: cell?.row }}
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
  );
}
