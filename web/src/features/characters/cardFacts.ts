import type { Treasure } from '@/shared/api/types';
import { DICE } from '@/shared/lib/card-types';
import { statLine } from '@/shared/lib/format';
import { upgradeCost } from './builder/gear';

type Dice = Partial<Record<string, number | undefined>>;

/** "2 blue + 1 orange"; null (unknown) → "?". */
function diceText(dice: Dice | null): string {
  if (dice === null) return '?';
  const parts = DICE.flatMap((die) => {
    const n = dice[die] ?? 0;
    return n > 0 ? [`${String(n)} ${die}`] : [];
  });
  return parts.length > 0 ? parts.join(' + ') : '—';
}

/** One line per attack: "1 st · 2 blue +1 · range 1 · magic". */
function attackLine(attack: Treasure['attacks'][number]): string {
  const dice = diceText(attack.dice);
  const parts = [
    `${String(attack.staminaCost)} st`,
    attack.damageModifier ? `${dice} +${String(attack.damageModifier)}` : dice,
  ];
  if (attack.range !== undefined) {
    parts.push(`range ${attack.range === 'infinite' ? '∞' : String(attack.range)}`);
  }
  if (attack.damageType === 'magical') parts.push('magic');
  return parts.join(' · ');
}

export type Fact = { label: string; lines: readonly string[] };

/** The card's numbers in words, for the chooser's zoomed view (the printed icons are small). */
export function cardFacts(card: Treasure): Fact[] {
  const facts: Fact[] = [{ label: 'Requires', lines: [statLine(card)] }];
  if (card.equip === 'upgrade') {
    facts.push(
      { label: 'Fits', lines: [card.upgradeTarget === 'armour' ? 'Armour' : 'Weapon'] },
      {
        label: 'Takes',
        lines: [`${String(upgradeCost(card))} upgrade slot${upgradeCost(card) > 1 ? 's' : ''}`],
      },
    );
    return facts;
  }
  facts.push({ label: 'Upgrade slots', lines: [String(card.upgradeSlots)] });
  if (card.attacks.length > 0)
    facts.push({ label: 'Attacks', lines: card.attacks.map(attackLine) });
  const { block, resist, dodge } = card.defence;
  facts.push({
    label: 'Defence',
    lines: [`Block ${diceText(block)} · Resist ${diceText(resist)}`, `Dodge ${String(dodge)}`],
  });
  return facts;
}

/** "Right hand · two-handed", "Armour", "Weapon upgrade". */
export function cardKind(card: Treasure): string {
  if (card.equip === 'upgrade')
    return card.upgradeTarget === 'armour' ? 'Armour upgrade' : 'Weapon upgrade';
  if (card.equip === 'armour') return 'Armour';
  return card.hands === 2 ? 'Hand · two-handed' : 'Hand · one-handed';
}
