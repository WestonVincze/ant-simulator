import { Quaternion, Vector3 } from "three";

export const getDistance2D = (pos1: { x: number, z: number }, pos2: { x: number, z: number }): number => {
  const dx = pos1.x - pos2.x;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dz * dz);
};

export const calculateDirection = (from: Vector3, to: Vector3) => {
  const direction = new Vector3(to.x - from.x, to.y - from.y, to.z - from.z);
  return direction.normalize();
}

export function getSensorWorldPositions(
  position: Vector3,
  direction: Vector3,
  sensorOffsets: {
    front: Vector3,
    left: Vector3,
    right: Vector3
  }
): {
  front: Vector3,
  left: Vector3,
  right: Vector3,
} {
  const up = new Vector3(0, 1, 0);
  const quaternion = new Quaternion().setFromUnitVectors(
    new Vector3(0,0,1),
    direction.clone().normalize()
  );

  const front = sensorOffsets.front.clone().applyQuaternion(quaternion).add(position);
  const left = sensorOffsets.left.clone().applyQuaternion(quaternion).add(position);
  const right = sensorOffsets.right.clone().applyQuaternion(quaternion).add(position);

  return { front, left, right };
}

export function rotateVector(v: Vector3, angleRadians: number): Vector3 {
  const axis = new Vector3(0, 1, 0); // Y-axis
  const quaternion = new Quaternion().setFromAxisAngle(axis, angleRadians);
  return v.clone().applyQuaternion(quaternion);
}
