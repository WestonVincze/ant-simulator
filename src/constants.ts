export const ANTHILL = {
  centerY: 1.5,
  topRadius: 1,
  baseRadius: 12,
  height: 8,
  entranceRadius: 0.8,
};

export function getAnthillHeight(dist: number): number {
  if (dist >= ANTHILL.baseRadius) return 0;
  const t = (ANTHILL.baseRadius - dist) / (ANTHILL.baseRadius - ANTHILL.topRadius);
  return Math.max(0, (ANTHILL.centerY - ANTHILL.height / 2) + t * ANTHILL.height);
}

export const ENTRANCE_Y = ANTHILL.centerY + ANTHILL.height / 2;
