import type { Dispatch, SyntheticEvent } from 'react';
import type { EncounterLevel, Objective, PartySize } from '@/shared/api/types';
import { SET_NAMES } from '@/shared/lib/card-types';
import { Button } from '@/shared/ui/Button';
import { CheckRow } from '@/shared/ui/CheckRow';
import {
  DIFFICULTIES,
  POOL_ORDER,
  type ControlsAction,
  type ForgeControls,
  type ForgeMode,
  type TileCount,
} from './controls';
import styles from './ForgeRail.module.css';

const ROMAN: Record<EncounterLevel, string> = { 1: 'I', 2: 'II', 3: 'III' };
const MODES: readonly { mode: ForgeMode; label: string }[] = [
  { mode: 'difficulty', label: 'By difficulty' },
  { mode: 'custom', label: 'Custom' },
];
const OBJECTIVES: readonly { value: Objective; label: string }[] = [
  { value: 'slay', label: 'Slay' },
  { value: 'survive', label: 'Survive' },
  { value: 'exit', label: 'Exit' },
];
const COUNTS = [1, 2, 3, 4] as const;
const LEVELS: readonly EncounterLevel[] = [1, 2, 3];

type ForgeRailProps = {
  controls: ForgeControls;
  dispatch: Dispatch<ControlsAction>;
  /** Switching to Custom carries over what the shown encounter was forged with. */
  onMode: (mode: ForgeMode) => void;
  onForge: () => void;
  forging: boolean;
  /** Set when the last forge failed. */
  error: string | null;
};

/** A row of filled choice buttons (tiles, level, party size, objective). */
function Choices<T extends string | number>({
  options,
  value,
  onPick,
  columns,
  className,
}: {
  options: readonly { value: T; label: string; name?: string }[];
  value: T;
  onPick: (value: T) => void;
  columns: number;
  className?: string;
}) {
  return (
    <div
      className={styles.choices}
      style={{ gridTemplateColumns: `repeat(${String(columns)}, minmax(0, 1fr))` }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={className ?? styles.choice}
          aria-pressed={option.value === value}
          aria-label={option.name}
          onClick={() => {
            onPick(option.value);
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Forge settings rail (ForgeFinal). Its state is `controls`; the request comes from `toRequest`. */
export function ForgeRail({ controls, dispatch, onMode, onForge, forging, error }: ForgeRailProps) {
  const custom = controls.mode === 'custom';
  const noPool = controls.sets.length === 0;
  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    if (!noPool && !forging) onForge();
  };

  return (
    <aside className={styles.rail} aria-label="Forge settings">
      <form className={styles.form} onSubmit={submit}>
        <div role="group" aria-label="Generator mode" className={styles.modes}>
          {MODES.map(({ mode, label }) => (
            <button
              key={mode}
              type="button"
              className={styles.mode}
              aria-pressed={controls.mode === mode}
              onClick={() => {
                onMode(mode);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {!custom && (
          <fieldset className={styles.field}>
            <legend className={styles.legend}>Difficulty</legend>
            {DIFFICULTIES.map(({ level, name, summary }) => (
              <button
                key={level}
                type="button"
                className={styles.difficulty}
                data-level={level}
                aria-pressed={controls.level === level}
                onClick={() => {
                  dispatch({ type: 'setLevel', level });
                }}
              >
                <span className={styles.ring} aria-hidden="true">
                  {ROMAN[level]}
                </span>
                <span className={styles.difficultyText}>
                  <span className={styles.difficultyName}>
                    Level {ROMAN[level]} · {name}
                    <span className="visually-hidden">, </span>
                  </span>
                  <span className={styles.difficultySum}>{summary}</span>
                </span>
              </button>
            ))}
            <span className={styles.hint}>
              Tiles, objective, special rules and Trial are picked to fit the level.
            </span>
          </fieldset>
        )}

        <fieldset className={styles.field}>
          <legend className={styles.legend}>Enemy pool</legend>
          {POOL_ORDER.map((set) => (
            <CheckRow
              key={set}
              size="lg"
              className={styles.pool}
              checked={controls.sets.includes(set)}
              label={SET_NAMES[set].name}
              onChange={() => {
                dispatch({ type: 'toggleSet', set });
              }}
            />
          ))}
        </fieldset>

        {custom && (
          <>
            <fieldset className={styles.field}>
              <legend className={styles.legend}>Tiles</legend>
              <Choices<TileCount>
                columns={4}
                options={COUNTS.map((n) => ({ value: n, label: String(n) }))}
                value={controls.tiles}
                onPick={(tiles) => {
                  dispatch({ type: 'setTiles', tiles });
                }}
              />
            </fieldset>
            <fieldset className={styles.field}>
              <legend className={styles.legend}>Encounter level</legend>
              <Choices<EncounterLevel>
                columns={3}
                className={styles.levelChoice}
                options={LEVELS.map((level) => ({
                  value: level,
                  label: ROMAN[level],
                  name: `Level ${ROMAN[level]}`,
                }))}
                value={controls.level}
                onPick={(level) => {
                  dispatch({ type: 'setLevel', level });
                }}
              />
            </fieldset>
          </>
        )}

        <fieldset className={styles.field}>
          <legend className={styles.legend}>Party size</legend>
          <Choices<PartySize>
            columns={4}
            options={COUNTS.map((n) => ({ value: n, label: String(n) }))}
            value={controls.partySize}
            onPick={(partySize) => {
              dispatch({ type: 'setPartySize', partySize });
            }}
          />
        </fieldset>

        {custom && (
          <fieldset className={styles.field}>
            <legend className={styles.legend}>Objective</legend>
            <Choices<Objective>
              columns={3}
              className={styles.objective}
              options={OBJECTIVES}
              value={controls.objective}
              onPick={(objective) => {
                dispatch({ type: 'setObjective', objective });
              }}
            />
            <CheckRow
              size="lg"
              className={styles.pool}
              checked={controls.trial}
              label="Add a Trial"
              onChange={(trial) => {
                dispatch({ type: 'setTrial', trial });
              }}
            />
          </fieldset>
        )}

        <Button
          type="submit"
          className={styles.forge}
          disabled={noPool || forging}
          aria-busy={forging}
        >
          {forging ? 'Forging…' : 'Forge encounter'}
        </Button>
        {error && (
          <p className={styles.notice} role="alert">
            {error}
          </p>
        )}
      </form>
    </aside>
  );
}
