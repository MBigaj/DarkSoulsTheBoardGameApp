import { describe, expect, it } from 'vitest';
import type { ForgedEncounter } from '@/shared/api/types';
import { controlsReducer, INITIAL_CONTROLS, toRequest, type ControlsAction } from './controls';

const run = (...actions: ControlsAction[]) => actions.reduce(controlsReducer, INITIAL_CONTROLS);

// What the rail needs from an encounter: its settings, not its map.
const encounter = (extra: Partial<ForgedEncounter>): ForgedEncounter =>
  ({
    id: 'e1',
    level: 3,
    partySize: 4,
    sets: ['pwa'],
    objective: 'survive',
    tiles: [{}, {}],
    specialRules: [],
    ...extra,
  }) as ForgedEncounter;

describe('toRequest: the request matches the rail', () => {
  it('By difficulty sends level, party and pool only', () => {
    const state = run({ type: 'setLevel', level: 1 }, { type: 'setPartySize', partySize: 2 });
    expect(toRequest(state)).toEqual({
      mode: 'difficulty',
      level: 1,
      partySize: 2,
      sets: ['tog', 'pwa', 'sc'],
    });
  });

  it('Custom adds tiles, objective and Trial as shown', () => {
    const state = run(
      { type: 'setMode', mode: 'custom' },
      { type: 'setTiles', tiles: 4 },
      { type: 'setObjective', objective: 'slay' },
      { type: 'setTrial', trial: true },
      { type: 'toggleSet', set: 'pwa' },
    );
    expect(toRequest(state)).toEqual({
      mode: 'custom',
      level: 2,
      partySize: 3,
      sets: ['tog', 'sc'],
      tiles: 4,
      objective: 'slay',
      trial: true,
    });
  });

  it('Custom values set earlier are not sent once back on By difficulty', () => {
    const state = run(
      { type: 'setMode', mode: 'custom' },
      { type: 'setTrial', trial: true },
      { type: 'setMode', mode: 'difficulty' },
    );
    expect(toRequest(state)).not.toHaveProperty('trial');
    // …but come back with Custom.
    expect(controlsReducer(state, { type: 'setMode', mode: 'custom' }).trial).toBe(true);
  });

  it('nothing to send with an empty pool', () => {
    const state = run(
      { type: 'toggleSet', set: 'tog' },
      { type: 'toggleSet', set: 'pwa' },
      { type: 'toggleSet', set: 'sc' },
    );
    expect(toRequest(state)).toBeNull();
    expect(controlsReducer(state, { type: 'toggleSet', set: 'sc' }).sets).toEqual(['sc']);
  });

  it('the pool keeps rail order whatever order sets are ticked in', () => {
    const state = run({ type: 'toggleSet', set: 'tog' }, { type: 'toggleSet', set: 'tog' });
    expect(state.sets).toEqual(['tog', 'pwa', 'sc']);
  });
});

describe('switching to Custom carries the current values over', () => {
  it('from the encounter on show: its tile count, objective and Trial', () => {
    const shown = encounter({
      tiles: [{}, {}] as ForgedEncounter['tiles'],
      objective: 'slay',
      trial: { objective: 'x' },
    });
    const state = controlsReducer(INITIAL_CONTROLS, { type: 'setMode', mode: 'custom', shown });
    expect(state).toMatchObject({ mode: 'custom', tiles: 2, objective: 'slay', trial: true });
  });

  it('only once: the player’s Custom values survive switching back and forth', () => {
    const shown = encounter({ tiles: [{}, {}] as ForgedEncounter['tiles'] });
    const state = run(
      { type: 'setMode', mode: 'custom', shown },
      { type: 'setTiles', tiles: 4 },
      { type: 'setMode', mode: 'difficulty' },
      { type: 'setMode', mode: 'custom', shown },
    );
    expect(state.tiles).toBe(4);
  });

  it('only once: carried-over values are not replaced by the next shown encounter', () => {
    const first = encounter({ tiles: [{}, {}] as ForgedEncounter['tiles'], objective: 'slay' });
    const next = encounter({
      id: 'e2',
      tiles: [{}] as ForgedEncounter['tiles'],
      objective: 'exit',
    });
    const state = run(
      { type: 'setMode', mode: 'custom', shown: first },
      { type: 'setMode', mode: 'difficulty' },
      { type: 'setMode', mode: 'custom', shown: next },
    );
    expect(state).toMatchObject({ tiles: 2, objective: 'slay' });
  });

  it('with nothing on show, the rail’s own values', () => {
    const state = controlsReducer(INITIAL_CONTROLS, { type: 'setMode', mode: 'custom' });
    expect(state).toMatchObject({ mode: 'custom', tiles: 3, objective: 'exit', trial: false });
  });
});

describe('an encounter opened by link', () => {
  it('fills an untouched rail with its settings', () => {
    const state = controlsReducer(INITIAL_CONTROLS, { type: 'load', encounter: encounter({}) });
    expect(state).toMatchObject({
      level: 3,
      partySize: 4,
      sets: ['pwa'],
      tiles: 2,
      objective: 'survive',
    });
    expect(toRequest(state)).toMatchObject({ level: 3, partySize: 4, sets: ['pwa'] });
  });

  it('never overwrites what the player changed', () => {
    const changed = run({ type: 'setPartySize', partySize: 1 });
    expect(controlsReducer(changed, { type: 'load', encounter: encounter({}) })).toBe(changed);
  });
});
