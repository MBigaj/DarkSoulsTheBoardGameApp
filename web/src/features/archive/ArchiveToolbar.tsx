import { useEffect, useId, useState } from 'react';
import type { CommonFilters } from './filters';
import styles from './ArchiveToolbar.module.css';

const DEBOUNCE_MS = 200;

type ArchiveToolbarProps = {
  q: string;
  sort: CommonFilters['sort'];
  placeholder: string;
  onChange: (values: Partial<CommonFilters>) => void;
};

/** Search (debounced into the URL) and sort. */
export function ArchiveToolbar({ q, sort, placeholder, onChange }: ArchiveToolbarProps) {
  const sortId = useId();
  const [draft, setDraft] = useState(q);
  const [urlQ, setUrlQ] = useState(q);
  // The URL changed from outside (Back, a tab switch): show its search instead of the draft.
  // The URL holds the trimmed draft, so our own write ("black ") must not replace what's typed.
  if (q !== urlQ) {
    setUrlQ(q);
    if (q !== draft.trim()) setDraft(q);
  }

  useEffect(() => {
    if (draft.trim() === q) return;
    const timer = setTimeout(() => {
      onChange({ q: draft });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [draft, q, onChange]);

  return (
    <div className={styles.toolbar}>
      <label className={styles.search}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" />
        </svg>
        <span className="visually-hidden">Search cards</span>
        <input
          type="search"
          className={styles.input}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => {
            setDraft(e.target.value);
          }}
        />
      </label>
      <label className={styles.sort} htmlFor={sortId}>
        Sort
        <select
          id={sortId}
          className={styles.select}
          value={sort}
          onChange={(e) => {
            onChange({ sort: e.target.value === 'name' ? 'name' : 'id' });
          }}
        >
          <option value="id">Card ID</option>
          <option value="name">Name A–Z</option>
        </select>
      </label>
    </div>
  );
}
