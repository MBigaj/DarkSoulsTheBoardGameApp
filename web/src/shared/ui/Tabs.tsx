import { useRef, type KeyboardEvent } from 'react';
import { cx } from '@/shared/lib/cx';
import styles from './Tabs.module.css';

export type TabItem<K extends string> = {
  id: K;
  label: string;
  count?: number;
};

type TabsProps<K extends string> = {
  /** Accessible name for the tab list, e.g. "Card type". */
  label: string;
  /** Each tab's id is `${idPrefix}-${item.id}`, so the panel can use aria-labelledby. */
  idPrefix: string;
  items: readonly TabItem<K>[];
  selected: K;
  onSelect: (id: K) => void;
  /** id of the element the tabs control (the results panel). */
  panelId?: string;
  className?: string;
};

/**
 * ARIA tabs with manual activation: arrow keys, Home and End move focus;
 * Enter, Space or a click selects. Selecting a tab loads data, so arrowing past one shouldn't.
 * Only the selected tab is in the Tab order.
 */
export function Tabs<K extends string>({
  label,
  idPrefix,
  items,
  selected,
  onSelect,
  panelId,
  className,
}: TabsProps<K>) {
  const refs = useRef(new Map<K, HTMLButtonElement>());

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = items.length - 1;
    const next =
      e.key === 'ArrowRight'
        ? index === last
          ? 0
          : index + 1
        : e.key === 'ArrowLeft'
          ? index === 0
            ? last
            : index - 1
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? last
              : -1;
    const target = items[next];
    if (!target) return;
    e.preventDefault();
    refs.current.get(target.id)?.focus();
  }

  return (
    <div role="tablist" aria-label={label} className={cx(styles.list, className)}>
      {items.map((item, index) => {
        const isSelected = item.id === selected;
        return (
          <button
            key={item.id}
            ref={(el) => {
              if (el) refs.current.set(item.id, el);
              else refs.current.delete(item.id);
            }}
            id={`${idPrefix}-${item.id}`}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls={panelId}
            tabIndex={isSelected ? 0 : -1}
            className={styles.tab}
            onKeyDown={(e) => {
              onKeyDown(e, index);
            }}
            onClick={() => {
              onSelect(item.id);
            }}
          >
            {item.label}
            {item.count !== undefined && <span className={styles.count}>{item.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
