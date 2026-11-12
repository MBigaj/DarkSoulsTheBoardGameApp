import { describe, expect, it } from 'vitest';
import { settleTarget, sideAt } from './useFlip';

describe('settleTarget', () => {
  it.each([
    // Snap: no flick, the nearest face wins.
    ['slow, under half a turn: back to the start', { base: 0, angle: 60, vx: 0.3 }, 0],
    ['slow, past half a turn: on to the next face', { base: 0, angle: 120, vx: 0.3 }, 180],
    ['slow to the left, past half a turn', { base: 0, angle: -100, vx: -0.2 }, -180],
    // Flick: faster than 1.1 px/ms in the drag's direction goes to the next face.
    ['flick right after a short drag', { base: 0, angle: 30, vx: 1.5 }, 180],
    ['flick left after a short drag', { base: 0, angle: -30, vx: -1.5 }, -180],
    ['exactly 1.1 px/ms is not a flick', { base: 0, angle: 30, vx: 1.1 }, 0],
    ['fast against the drag is not a flick: nearest face', { base: 0, angle: 30, vx: -2 }, 0],
    // One face at most per gesture.
    ['dragged two faces round: stops one face on', { base: 0, angle: 400, vx: 0 }, 180],
    ['flicked after a long drag: still one face', { base: 0, angle: 300, vx: 3 }, 180],
    ['dragged far left: one face back', { base: 180, angle: -250, vx: 0 }, 0],
  ])('%s', (_name, release, target) => {
    expect(settleTarget(release)).toBe(target);
  });

  it('grabbed mid-turn: works from the face it was heading to', () => {
    // Turning from 0 to 180 and grabbed half way: the drag starts at 180, not at 0 or 90.
    expect(settleTarget({ base: 180, angle: 190, vx: 0 })).toBe(180);
    expect(settleTarget({ base: 180, angle: 200, vx: 2 })).toBe(360);
    expect(settleTarget({ base: 180, angle: 170, vx: -2 })).toBe(0);
  });
});

describe('sideAt', () => {
  it('every 180° is the other face, both ways round', () => {
    expect([0, 180, 360, -180, -360, 540].map(sideAt)).toEqual([
      'front',
      'back',
      'front',
      'back',
      'front',
      'back',
    ]);
  });
});
