import type { SVGProps } from 'react';

// Stroke icons drawn in currentColor. Decorative by default; pass aria-label to expose one.
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 16, children, ...rest }: IconProps) {
  const labelled = rest['aria-label'] !== undefined;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={labelled ? undefined : true}
      role={labelled ? 'img' : undefined}
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function FlameIcon(props: IconProps) {
  return (
    <Svg strokeWidth={1.8} {...props}>
      <path d="M12 2.5c1.2 3.2 4.8 5.3 4.8 9.6a4.8 4.8 0 0 1-9.6 0c0-2.3 1.2-3.6 2.3-4.6.1 2 1.1 3.2 2.3 3.4-.5-3.1.2-5.6.2-8.4z" />
    </Svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg size={12} strokeWidth={2} {...props}>
      <path d="M6 9l6 6 6-6" />
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg size={10} strokeWidth={2.4} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg strokeWidth={1.6} {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </Svg>
  );
}
