import type { Tool } from './content';

/** The tool cards' line icons (HomeFinal). Decorative: each card's title names the tool. */
export function ToolIcon({ icon }: { icon: Tool['icon'] }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {icon === 'archive' && (
        <>
          <rect x="7" y="4" width="11" height="15" rx="1" />
          <path d="M5 7v12.5a1 1 0 0 0 1 1h9" />
        </>
      )}
      {icon === 'builder' && (
        <>
          <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
          <path d="M9 11h6M12 8v8" />
        </>
      )}
      {icon === 'forge' && (
        <>
          <rect x="4" y="4" width="16" height="16" />
          <path d="M4 12h16M12 4v16" />
          <circle cx="8" cy="8" r="1.2" />
          <circle cx="16" cy="16" r="1.2" />
        </>
      )}
    </svg>
  );
}
