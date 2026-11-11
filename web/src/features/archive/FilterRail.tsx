import type { CardType, Die, SetCode } from '@/shared/lib/card-types';
import type { Bounds } from '@/shared/lib/url-state';
import { CheckRow } from '@/shared/ui/CheckRow';
import { DiceToggle } from '@/shared/ui/DiceToggle';
import { FilterField, FilterGroup } from '@/shared/ui/FilterGroup';
import { MinMaxSlider } from '@/shared/ui/MinMaxSlider';
import { Pill } from '@/shared/ui/Pill';
import { RangeSlider } from '@/shared/ui/RangeSlider';
import {
  RAIL_SETS,
  railFor,
  selectedCount,
  SET_NAMES,
  shownSets,
  type RailFilter,
  type RailGroup,
} from './rail';
import type { ArchiveTab } from './tabs';
import type { Update } from './useArchiveParams';
import styles from './FilterRail.module.css';

type Values = Record<string, unknown>;

type FilterRailProps = {
  tab: ArchiveTab | undefined;
  sets: readonly SetCode[];
  /** Cards per set in this view; undefined while the catalog loads. */
  setCounts: Record<SetCode, number> | undefined;
  onToggleSet: (set: SetCode) => void;
  /** All types: the type list with counts. */
  typeLinks: readonly { tab: ArchiveTab; count: number | undefined }[];
  onOpenType: (type: CardType) => void;
  filters: Values;
  onChange: (update: Update) => void;
  /** Class pills: slug and name, from the classes data. */
  classes: readonly { id: string; name: string }[];
  onReset: () => void;
};

/** ArchiveFinal filter dock: core sets, the type list (All types) or the type's filter groups. */
export function FilterRail({
  tab,
  sets,
  setCounts,
  onToggleSet,
  typeLinks,
  onOpenType,
  filters,
  onChange,
  classes,
  onReset,
}: FilterRailProps) {
  const shown = shownSets(sets);
  const groups: readonly RailGroup[] = tab ? railFor(tab.type) : [];
  return (
    <aside className={styles.rail} aria-label="Filters">
      <div className={styles.head}>
        <span className={styles.heading}>Filter archive</span>
        <button type="button" className={styles.reset} onClick={onReset}>
          Reset all
        </button>
      </div>

      <FilterField label="Core set" className={styles.block}>
        {RAIL_SETS.map((set) => {
          const on = shown.includes(set);
          return (
            <CheckRow
              key={set}
              size="lg"
              checked={on}
              // The last ticked set stays: "no set" can't show anything.
              disabled={on && shown.length === 1}
              label={SET_NAMES[set].name}
              count={setCounts?.[set]}
              onChange={() => {
                onToggleSet(set);
              }}
            />
          );
        })}
      </FilterField>

      {!tab && (
        <FilterField label="Card type" className={styles.block}>
          {typeLinks.map(({ tab: link, count }) => (
            <button
              key={link.type}
              type="button"
              className={styles.typeLink}
              onClick={() => {
                onOpenType(link.type);
              }}
            >
              <span className={styles.diamond} data-type={link.type} aria-hidden="true" />
              <span className={styles.typeLabel}>{link.label}</span>
              <span className={styles.typeCount}>{count === undefined ? '' : String(count)} →</span>
            </button>
          ))}
          <span className={styles.hint}>Open a card type for filters that fit it.</span>
        </FilterField>
      )}

      {tab && groups.length === 0 && (
        <p className={styles.later}>Filters for behaviour decks come later.</p>
      )}

      {groups.map((group) => (
        <FilterGroup
          // Remount per type, so each type starts from its own default open groups.
          key={`${tab?.type ?? ''}-${group.title}`}
          title={group.title}
          defaultOpen={group.open}
          count={group.filters.reduce((sum, filter) => sum + selectedCount(filter, filters), 0)}
        >
          {group.filters.map((filter) => (
            <Filter
              key={filter.kind === 'max' ? filter.label : filter.key}
              filter={filter}
              values={filters}
              onChange={onChange}
              classes={classes}
            />
          ))}
        </FilterGroup>
      ))}
    </aside>
  );
}

type FilterProps = {
  filter: RailFilter;
  values: Values;
  onChange: (update: Update) => void;
  classes: readonly { id: string; name: string }[];
};

function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function Filter({ filter, values, onChange, classes }: FilterProps) {
  switch (filter.kind) {
    case 'pills':
    case 'classes': {
      const picked = values[filter.key] as readonly (string | number)[];
      const options =
        filter.kind === 'pills' ? filter.options : classes.map((c) => [c.id, c.name] as const);
      return (
        <FilterField label={filter.label}>
          <div className={styles.pills}>
            {options.map(([value, label]) => (
              <Pill
                key={String(value)}
                selected={picked.includes(value)}
                onChange={() => {
                  onChange((latest) => ({
                    [filter.key]: toggle(latest[filter.key] as readonly unknown[], value),
                  }));
                }}
              >
                {label}
              </Pill>
            ))}
          </div>
        </FilterField>
      );
    }
    case 'checks': {
      const picked = values[filter.key] as readonly (string | number)[];
      return (
        <FilterField label={filter.label}>
          <div className={styles.checks}>
            {filter.options.map(([value, label]) => (
              <CheckRow
                key={String(value)}
                checked={picked.includes(value)}
                label={label}
                onChange={() => {
                  onChange((latest) => ({
                    [filter.key]: toggle(latest[filter.key] as readonly unknown[], value),
                  }));
                }}
              />
            ))}
          </div>
        </FilterField>
      );
    }
    case 'dice': {
      const picked = values[filter.key] as readonly Die[];
      return (
        <FilterField label={filter.label}>
          <DiceToggle
            selected={picked}
            onToggle={(die) => {
              onChange((latest) => ({
                [filter.key]: toggle(latest[filter.key] as readonly unknown[], die),
              }));
            }}
          />
        </FilterField>
      );
    }
    case 'max':
      return (
        <FilterField label={filter.label}>
          {filter.sliders.map((slider) => {
            const value = values[slider.key] as number | undefined;
            return (
              <RangeSlider
                key={slider.key}
                label={slider.label}
                ariaLabel={`Maximum ${slider.label} requirement`}
                min={0}
                max={filter.max}
                value={value ?? filter.max}
                display={(v) => (v >= filter.max ? 'Any' : `≤ ${String(v)}`)}
                onChange={(v) => {
                  onChange({ [slider.key]: v >= filter.max ? undefined : v });
                }}
              />
            );
          })}
        </FilterField>
      );
    case 'min': {
      const value = values[filter.key] as number | undefined;
      return (
        <FilterField label={filter.label}>
          <RangeSlider
            label={filter.slider}
            min={filter.min}
            max={filter.max}
            value={value ?? filter.min}
            display={(v) => (v <= filter.min ? 'Any' : `≥ ${String(v)}`)}
            onChange={(v) => {
              onChange({ [filter.key]: v <= filter.min ? undefined : v });
            }}
          />
        </FilterField>
      );
    }
    case 'range': {
      const bounds = values[filter.key] as Bounds;
      return (
        <FilterField label={filter.label}>
          <MinMaxSlider
            label={filter.label}
            min={filter.min}
            max={filter.max}
            value={[bounds.min ?? filter.min, bounds.max ?? filter.max]}
            onChange={([lo, hi]) => {
              onChange({
                [filter.key]: {
                  ...(lo > filter.min ? { min: lo } : {}),
                  ...(hi < filter.max ? { max: hi } : {}),
                },
              });
            }}
          />
        </FilterField>
      );
    }
  }
}
