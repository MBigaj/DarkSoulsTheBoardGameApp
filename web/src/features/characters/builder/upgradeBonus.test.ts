import { describe, expect, it } from 'vitest';
import type { AttackBonus, Treasure } from '@/shared/api/types';
import {
  bonusLines,
  bonusText,
  contributions,
  dieBonus,
  withBonuses,
  type BonusContext,
} from './upgradeBonus';

const card = (name: string, extra: Partial<Treasure> = {}) =>
  ({ _id: name, name, deck: 'treasure', ...extra }) as Treasure;
const upgrade = (name: string, attackBonus?: AttackBonus[]) =>
  card(name, attackBonus ? { attackBonus: attackBonus as Treasure['attackBonus'] } : {});

const ctx: BonusContext = { highestStamina: true, vsBoss: false, heavilyDamaged: false };
const axe = card('Axe');
const base = { dice: { black: 2, blue: 0, orange: 0 }, modifier: 0, stamina: 3 };

describe('bonusLines', () => {
  it('one line per effect, weapon upgrades first, upgrades with no numbers left out', () => {
    const lines = bonusLines(
      axe,
      [upgrade('Heavy Gem', [{ dice: { black: 1 } }]), upgrade('Blood Gem')],
      [upgrade('Red Tearstone Ring', [{ damage: 1, condition: 'heavilyDamaged' }])],
      ctx,
    );
    expect(lines.map((l) => [l.upgrade.name, l.applies, l.note, l.tick])).toEqual([
      ['Heavy Gem', true, null, null],
      ['Red Tearstone Ring', false, '4+ damage on this character', 'heavilyDamaged'],
    ]);
  });

  it('ticked conditions apply', () => {
    const scale = upgrade('Dragon Scale', [{ damage: 2, condition: 'vsBoss' }]);
    expect(bonusLines(axe, [scale], [], ctx)[0]?.applies).toBe(false);
    expect(bonusLines(axe, [scale], [], { ...ctx, vsBoss: true })[0]?.applies).toBe(true);
  });

  it('"boss treasure" comes from the weapon’s data, not a tick', () => {
    const demon = upgrade('Demon Titanite', [
      { damage: 1 },
      { stamina: -1, attacks: 'highestStamina', condition: 'bossTreasure' },
    ]);
    const plain = bonusLines(axe, [demon], [], ctx);
    expect(plain.map((l) => [l.applies, l.note])).toEqual([
      [true, null],
      [false, 'Only on boss treasure'],
    ]);
    const bossAxe = card('Black Knight Axe', { deck: 'boss' });
    expect(bonusLines(bossAxe, [demon], [], ctx)[1]).toMatchObject({
      applies: true,
      note: 'Black Knight Axe is a boss treasure',
    });
  });

  it('"highest-stamina attack" effects need that option loaded', () => {
    const simple = upgrade('Simple Gem', [{ stamina: -1, attacks: 'highestStamina' }]);
    expect(bonusLines(axe, [simple], [], ctx)[0]).toMatchObject({ applies: true });
    expect(bonusLines(axe, [simple], [], { ...ctx, highestStamina: false })[0]).toMatchObject({
      applies: false,
      note: 'Highest-stamina attack only',
    });
  });
});

describe('withBonuses', () => {
  it('adds applying lines on top of the card’s values; stamina never below 0', () => {
    const lines = bonusLines(
      axe,
      [
        upgrade('Heavy Gem', [{ dice: { black: 1 } }]),
        upgrade('Raw Gem', [{ damage: 2, stamina: 2 }]),
        upgrade('Dragon Scale', [{ damage: 2, condition: 'vsBoss' }]),
      ],
      [],
      ctx,
    );
    expect(withBonuses(base, lines)).toEqual({
      dice: { black: 3, blue: 0, orange: 0 },
      modifier: 2,
      stamina: 5,
    });
    const cheap = bonusLines(
      axe,
      [upgrade('Simple Gem', [{ stamina: -1, attacks: 'highestStamina' }])],
      [],
      ctx,
    );
    expect(withBonuses({ ...base, stamina: 0 }, cheap).stamina).toBe(0);
  });
});

describe('explicit values', () => {
  it('says what each effect adds, and which upgrades add to one input', () => {
    expect(bonusText({ damage: 2, stamina: 2 })).toBe('+2 damage · +2 stamina');
    expect(bonusText({ dice: { black: 1 } })).toBe('+1 black die');
    expect(bonusText({ stamina: -1 })).toBe('−1 stamina');
    const lines = bonusLines(
      axe,
      [
        upgrade('Heavy Gem', [{ dice: { black: 1 } }]),
        upgrade('Sharp Gem', [{ dice: { black: 1 } }]),
      ],
      [],
      ctx,
    );
    expect(contributions(lines, dieBonus('black'))).toEqual([
      { name: 'Heavy Gem', amount: 1 },
      { name: 'Sharp Gem', amount: 1 },
    ]);
    expect(contributions(lines, dieBonus('blue'))).toEqual([]);
  });
});
