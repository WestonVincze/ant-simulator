import { trait } from "koota";
import { Vector3 } from "three";

export const Position = trait(() => new Vector3);

export const Move = trait({
  maxSpeed: 4,
  currentSpeed: 4,
});

export const Direction = trait({
  desired: () => new Vector3,
  current: () => new Vector3,
  timeSinceLastTurnAround: 0 
});

export const RandomDirection = trait({
  direction: () => new Vector3,
  timeSinceLastUpdate: 0
});

export const Sensors = trait({
  frontOffset: () => new Vector3,
  leftOffset: () => new Vector3,
  rightOffset:() => new Vector3,
  lookingFor: "food",
  value: 0,
  radius: 1
});
