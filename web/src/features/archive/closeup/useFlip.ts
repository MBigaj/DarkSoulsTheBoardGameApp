import { useCallback, useRef, useState, type PointerEvent } from 'react';

/** Flick speed, px/ms: a faster release turns the card to the next face (handoff). */
export const FLICK = 1.1;
/** Degrees of turn per px dragged sideways. */
const TURN_PER_PX = 0.3;
/** Degrees of tilt per px dragged up or down, and its limit. */
const TILT_PER_PX = 0.04;
const MAX_TILT = 7;
/** Below this many px sideways a press is a tap: the card stays where it is. */
const TAP_PX = 4;
/** A release this long (ms) after the last move is a stop, not a flick. */
const STALE_MS = 80;

export type Side = 'front' | 'back';

/** Every 180° is a face: front at 0, back at 180, front again at 360… */
export function sideAt(angle: number): Side {
  return Math.abs(Math.round(angle / 180)) % 2 === 0 ? 'front' : 'back';
}

/**
 * Where a released drag settles, in degrees.
 * - `base`: the face the drag started from (the face the card was heading to, if grabbed mid-turn);
 * - `angle`: where the drag left the card; `vx`: release speed, px/ms (+ = right).
 * A flick in the drag's direction goes on to the next face; otherwise the nearest face wins.
 * Never more than one face from `base`.
 */
export function settleTarget({
  base,
  angle,
  vx,
}: {
  base: number;
  angle: number;
  vx: number;
}): number {
  const direction = Math.sign(angle - base);
  const flick = Math.abs(vx) > FLICK && Math.sign(vx) === direction;
  const target = flick ? base + 180 * direction : Math.round(angle / 180) * 180;
  return Math.min(base + 180, Math.max(base - 180, target));
}

/** CSS transform for a turn and tilt; both functions always, so the browser never goes via a matrix. */
export function flipTransform(turn: number, tilt = 0): string {
  return `rotateX(${String(tilt)}deg) rotateY(${String(turn)}deg)`;
}

type Drag = {
  pointerId: number;
  x: number;
  y: number;
  base: number;
  angle: number;
  lastX: number;
  lastT: number;
  vx: number;
  moved: boolean;
};

/**
 * Drag-to-flip for the close-up card. `angle` is the face the card rests on (or is turning to);
 * while a drag is on, the transform is written straight to the element (no re-render per move)
 * and `data-dragging` turns the settle transition off.
 */
export function useFlip() {
  const [angle, setAngle] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  /** The face the card rests on or is turning to; a ref, so handlers never read a stale render. */
  const angleRef = useRef(0);

  const settle = useCallback((target: number) => {
    const el = cardRef.current;
    if (el) {
      delete el.dataset.dragging;
      // Written here too: if the target equals the last state, React wouldn't touch the style.
      el.style.transform = flipTransform(target);
    }
    angleRef.current = target;
    setAngle(target);
  }, []);

  const turn = useCallback(
    (direction: 1 | -1) => {
      // From the face it's heading to, so quick presses add up a face at a time.
      settle(angleRef.current + 180 * direction);
    },
    [settle],
  );

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const el = event.currentTarget;
    try {
      el.setPointerCapture(event.pointerId);
    } catch {
      // Not an active pointer (synthetic events): the drag still works while over the card.
    }
    el.dataset.dragging = '';
    const now = performance.now();
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      base: angleRef.current,
      angle: angleRef.current,
      lastX: event.clientX,
      lastT: now,
      vx: 0,
      moved: false,
    };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (d?.pointerId !== event.pointerId) return;
    const now = performance.now();
    const dt = Math.max(1, now - d.lastT);
    d.vx = 0.75 * ((event.clientX - d.lastX) / dt) + 0.25 * d.vx;
    d.lastX = event.clientX;
    d.lastT = now;
    const dx = event.clientX - d.x;
    if (Math.abs(dx) > TAP_PX) d.moved = true;
    d.angle = d.base + dx * TURN_PER_PX;
    const tilt = Math.max(-MAX_TILT, Math.min(MAX_TILT, -(event.clientY - d.y) * TILT_PER_PX));
    event.currentTarget.style.transform = flipTransform(d.angle, tilt);
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (d?.pointerId !== event.pointerId) return;
    drag.current = null;
    if (!d.moved) {
      settle(d.base);
      return;
    }
    const vx = performance.now() - d.lastT > STALE_MS ? 0 : d.vx;
    settle(settleTarget({ base: d.base, angle: d.angle, vx }));
  }

  return {
    angle,
    side: sideAt(angle),
    cardRef,
    turn,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  };
}
