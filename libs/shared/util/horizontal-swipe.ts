export interface SwipePoint {
  x: number;
  y: number;
  time: number;
  pointerId: number;
}

/** A deliberate horizontal touch gesture; vertical scrolling and taps stay native. */
export function horizontalSwipe(start: SwipePoint | null, end: SwipePoint): -1 | 0 | 1 {
  if (!start || start.pointerId !== end.pointerId) return 0;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const elapsed = end.time - start.time;
  if (elapsed < 0 || elapsed > 900 || Math.abs(dx) < 60 || Math.abs(dx) <= Math.abs(dy) * 1.35) return 0;
  return dx < 0 ? 1 : -1;
}

export function swipePoint(event: PointerEvent): SwipePoint {
  return { x: event.clientX, y: event.clientY, time: event.timeStamp, pointerId: event.pointerId };
}
