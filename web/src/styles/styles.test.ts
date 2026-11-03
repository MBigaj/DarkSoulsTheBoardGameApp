import { describe, expect, it } from 'vitest';
import fontsCss from './fonts.css?raw';
import motionCss from './motion.css?raw';
import tokensCss from './tokens.css?raw';

/** Custom properties declared in the first (:root) block, lower-cased values. */
function rootTokens(css: string): Map<string, string> {
  const block = /:root\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';
  const tokens = new Map<string, string>();
  for (const [, name, value] of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    if (name && value) tokens.set(name, value.trim().toLowerCase());
  }
  return tokens;
}

// From claude/design-handoff.md → Tokens and Fixed colours.
const HANDOFF: Record<string, string> = {
  '--bg': '#0d0b0b',
  '--panel': '#141011',
  '--panel2': '#1a1415',
  '--border': '#43302f',
  '--line': '#2a2020',
  '--text': '#e8ddcc',
  '--muted': '#a8998c',
  '--accent': '#9e2a2f',
  '--on-accent': '#f6ebdc',
  '--accent-text': '#e06565',
  '--ornament': '#bfa46a',
  '--tint': '#241416',
  '--glow': 'rgba(170, 40, 45, 0.55)',
  '--hero-glow': 'rgba(158, 42, 47, 0.3)',
  '--hatch': 'rgba(191, 164, 106, 0.07)',
  '--node-start': '#d6a648',
  '--node-spawn': '#c4473b',
  '--node-terrain': '#b36ad6',
  '--die-black': '#1b1a18',
  '--die-black-edge': '#8a8273',
  '--die-blue': '#3f6fa6',
  '--die-blue-edge': '#7fa7c4',
  '--die-orange': '#e08a3c',
  '--die-orange-edge': '#f2a865',
  '--badge-treasure': '#c9a45c',
  '--badge-enemy': '#b3aa9a',
  '--badge-boss': 'var(--accent-text)',
  '--badge-behaviour': '#7fa7c4',
  '--badge-encounter': '#93b58d',
  '--badge-event': '#c79ad6',
  '--level-1': '#9fc3dd',
  '--level-2': '#7f9be0',
  '--level-3': '#b08ae0',
};

describe('tokens.css', () => {
  const tokens = rootTokens(tokensCss);

  it.each(Object.entries(HANDOFF))('defines %s as in the handoff', (name, value) => {
    expect(tokens.get(name)).toBe(value);
  });

  it('is dark only', () => {
    expect(tokensCss).toMatch(/color-scheme:\s*dark/);
  });
});

describe('fonts.css', () => {
  const shipped = new Set(
    Object.keys(import.meta.glob('/node_modules/@fontsource/*/files/*.woff2')).map((path) =>
      path.replace('/node_modules/', ''),
    ),
  );
  const sources = [...fontsCss.matchAll(/url\('([^']+)'\)/g)].map((m) => m[1] ?? '');

  it('declares the handoff families and weights, woff2 only', () => {
    expect(sources).toHaveLength(11);
    expect(sources.every((src) => src.endsWith('.woff2'))).toBe(true);
    expect(fontsCss).not.toMatch(/\.woff'/);
  });

  it.each(sources)('points at a file that exists: %s', (src) => {
    expect(shipped.has(src)).toBe(true);
  });
});

describe('motion.css', () => {
  it('turns transitions and animations off under reduced motion', () => {
    expect(motionCss).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(motionCss).toMatch(/transition-duration:\s*0\.01ms !important/);
    expect(motionCss).toMatch(/animation-duration:\s*0\.01ms !important/);
  });
});
