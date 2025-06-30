import { World } from "koota";
import { Quaternion, Vector3 } from "three";

import { Direction, IsAnt, MeshRef, Move, Position, RandomDirection, Targeting } from "../traits";
import { calculateDirection } from "../../utils";

// for demo purposes we store all systems in a single file

/**
 * Update position of three.js meshes to reflect value of Position trait values 
 */

export const HandleMove = ({ world, delta }: { world: World, delta: number }) => {
  world.query(Position, Direction, Move).updateEach(([ pos, dir, move ]) => {
    pos.x += dir.current.x * move.speed * delta;
    pos.y += dir.current.y * move.speed * delta;
    pos.z += dir.current.z * move.speed * delta;
  })
}

export const HandleRotation = ({ world, delta }: { world: World, delta: number }) => {
  world.query(Direction).updateEach(([ dir ], entity) => {
    let desired = dir.desired.clone();
    const randomDir = entity.get(RandomDirection);

    if (randomDir?.direction) {
      desired = desired.add(randomDir.direction.clone().multiplyScalar(0.3))
    }

    dir.current.lerp(desired, 2 * delta).normalize();
  })
}

export const MoveAntsToTarget = ({ world, delta }: { world: World, delta: number }) => {
  const ROTATION_SPEED = 2;
  world.query(Position, MeshRef, Targeting('*'), IsAnt).updateEach(([ pos, meshRef ], entity) => {
    const mesh = meshRef.ref;

    if (!mesh) return;

    const target = entity.targetFor(Targeting);
    const targetPos = target?.get(Position);

    if (!target || !targetPos) return;

    // Calculate direction vector from rotation
    const direction = calculateDirection(new Vector3(pos.x, 0, pos.z), new Vector3(targetPos.x, 0, targetPos.z));

    const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), direction)
    // mesh.quaternion.copy(quaternion);
    mesh.quaternion.slerp(quaternion, ROTATION_SPEED * delta);
    // direction.applyQuaternion(mesh.quaternion); // Apply rotation to get world direction

    // Update position to move in the direction of the rotation
    const speed = 4;
    pos.x += direction.x * speed * delta;
    pos.y += direction.y * speed * delta;
    pos.z += direction.z * speed * delta;
  });
}