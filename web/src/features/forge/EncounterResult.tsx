import type { Enemy, ForgedEncounter, SpecialRule } from '@/shared/api/types';
import { useCatalog } from '@/shared/api/queries';
import { imageUrl } from '@/shared/lib/card-image';
import { KEYWORD_NAMES, SET_NAMES } from '@/shared/lib/card-types';
import { DIFFICULTIES } from './controls';
import { EncounterMap } from './EncounterMap';
import styles from './EncounterResult.module.css';
import { terrainName } from './mapLayout';

const ROMAN = { 1: 'I', 2: 'II', 3: 'III' } as const;
/** "tog-enemy-skeleton-soldier" → "Skeleton soldier": a name to show when the card can't be. */
function enemyFallbackName(enemyId: string): string {
  const slug = enemyId.replace(/^(sc|tog|pwa)-enemy-/, '').replace(/-/g, ' ');
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

const plural = (n: number, one: string, many: string) => `${String(n)} ${n === 1 ? one : many}`;

/** Objective in words. Survive has no turn count yet: the draft contract doesn't carry one. */
function objectiveText(encounter: ForgedEncounter): string {
  const tiles = encounter.tiles.length;
  switch (encounter.objective) {
    case 'slay':
      if (tiles === 1) return 'Kill every enemy on the tile.';
      return tiles === 2
        ? 'Kill every enemy across both tiles.'
        : `Kill every enemy across all ${String(tiles)} tiles.`;
    case 'exit': {
      const exit = encounter.tiles.find((t) => t.nodes.some((n) => n.kind === 'exit'));
      return exit
        ? `Get every character onto the exit node on tile ${String(exit.tile)}.`
        : 'Get every character onto the exit node.';
    }
    case 'survive':
      return 'Survive.';
  }
}

/** "Timer 6", "Poison mist · tile 2"; free-text rules have no keyword tag. */
function ruleTag(rule: SpecialRule): string | null {
  if (!rule.keyword) return null;
  const name = KEYWORD_NAMES[rule.keyword];
  const withN = rule.n === undefined ? name : `${name} ${String(rule.n)}`;
  return rule.tile === undefined ? withN : `${withN} · tile ${String(rule.tile)}`;
}

/** The forged encounter (ForgeFinal result): header, map, legend, objective, rules and roster. */
export function EncounterResult({ encounter }: { encounter: ForgedEncounter }) {
  const catalog = useCatalog('enemy');
  const enemies = new Map(
    catalog.cards
      .filter((card): card is Enemy => card.type === 'enemy')
      .map((card) => [card._id, card]),
  );
  const level = DIFFICULTIES.find((d) => d.level === encounter.level);

  return (
    <>
      <div className={styles.frame}>
        <div className={styles.header}>
          <div className={styles.titles}>
            <span className={styles.eyebrow}>
              Level {ROMAN[encounter.level]} · {plural(encounter.tiles.length, 'tile', 'tiles')} ·{' '}
              {plural(encounter.partySize, 'player', 'players')}
            </span>
            <h2 className={styles.title}>{level?.name ?? `Level ${ROMAN[encounter.level]}`}</h2>
          </div>
          <span className={styles.sets}>
            {encounter.sets.map((set) => SET_NAMES[set].name).join(' · ')}
          </span>
        </div>

        <EncounterMap encounter={encounter} />

        <ul className={styles.legend} aria-label="Map key">
          {(
            [
              ['start', 'Character start'],
              ['spawn', 'Enemy spawn'],
              ['terrain', 'Terrain'],
              ['doorway', 'Doorway'],
              ['exit', 'Exit'],
            ] as const
          ).map(([kind, label]) => (
            <li key={kind}>
              <span className={styles.swatch} data-kind={kind} aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.details}>
        <div className={styles.column}>
          <div className={styles.objective}>
            <h3 className={styles.label}>Objective</h3>
            <p>{objectiveText(encounter)}</p>
            {encounter.trial && <p className={styles.trial}>Trial — {encounter.trial.objective}</p>}
          </div>
          {encounter.specialRules.length > 0 && (
            <div className={styles.column}>
              <h3 className={styles.label}>Special rules</h3>
              <ul className={styles.rules}>
                {encounter.specialRules.map((rule, i) => {
                  const tag = ruleTag(rule);
                  return (
                    <li key={i}>
                      {tag && <span className={styles.rule}>{tag}</span>}
                      {rule.text && <span className={styles.ruleText}>{rule.text}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className={styles.column}>
          <h3 className={styles.label}>
            Enemies ({encounter.enemies.length}) · Terrain ({encounter.terrain.length})
          </h3>
          {catalog.error && (
            <p className={styles.rosterNote}>Enemy details couldn&apos;t be loaded.</p>
          )}
          <ul className={styles.roster}>
            {encounter.enemies.map((entry, i) => {
              const card = enemies.get(entry.enemyId);
              const art = imageUrl(card?.art);
              return (
                <li key={`e${String(i)}`} className={styles.row}>
                  <span className={styles.badge} data-kind="spawn" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className={styles.thumb}>
                    {art && <img src={art} alt="" loading="lazy" />}
                  </span>
                  <span className={styles.name}>
                    {card?.name ??
                      (catalog.complete || catalog.error
                        ? enemyFallbackName(entry.enemyId)
                        : 'Loading…')}
                  </span>
                  <span className={styles.tag}>
                    T{entry.tile}
                    {card && ` · Threat ${String(card.threat)}`}
                  </span>
                </li>
              );
            })}
            {encounter.terrain.map((entry, i) => (
              <li key={`t${String(i)}`} className={styles.row}>
                <span className={styles.badge} data-kind="terrain" aria-hidden="true">
                  {terrainName(entry.name).charAt(0)}
                </span>
                <span className={styles.name}>{terrainName(entry.name)}</span>
                <span className={styles.tag}>T{entry.tile} · Terrain</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className={styles.note}>
        Real tiles from the data store, turned so their doorways meet. Enemies and terrain sit on
        each tile&apos;s printed spawn and terrain nodes; boss arenas are left out.
      </p>
    </>
  );
}
