import { World } from "koota";
import { Quaternion, Vector3 } from "three";

import { Direction, IsAnt, Move, Position, RandomDirection, Targeting } from "../traits";
import { calculateDirection } from "../../utils";

// for demo purposes we store all systems in a single file

/**
 * Update position of three.js meshes to reflect value of Position trait values 
 */

const MAX_DISTANCE = 100;

export const HandleMove = ({ world, delta }: { world: World, delta: number }) => {
  world.query(Position, Direction, Move).updateEach(([ pos, dir, move ]) => {
    if (move.currentSpeed < move.maxSpeed) {
      move.currentSpeed = Math.min(move.maxSpeed, move.currentSpeed + 5 * delta);
    }
    pos.x += dir.current.x * move.currentSpeed * delta;
    pos.y += dir.current.y * move.currentSpeed * delta;
    pos.z += dir.current.z * move.currentSpeed * delta;
  })
}

export const HandleRotation = ({ world, delta }: { world: World, delta: number }) => {
  world.query(Direction).updateEach(([ dir ], entity) => {
    let desired = dir.desired.clone();
    const randomDir = entity.get(RandomDirection);

    if (randomDir?.direction) {
      desired = desired.add(randomDir.direction.clone().multiplyScalar(0.6))
    }

    dir.current.lerp(desired, 2 * delta).normalize();
  })
}

export const DirectionalJitter = ({ world, delta }: { world: World, delta: number }) => {
  const RANDOM_DIRECTION_UPDATE_INTERVAL = 0.5;
  const MAX_TURN_ANGLE = Math.PI / 3;

  world.query(Position, Direction, IsAnt).updateEach(([ pos, dir ], entity) => {
    let randomDirection  = entity.get(RandomDirection);

    if (!randomDirection) {
      const direction = new Vector3(
        Math.random() * 2 - 1,
        0,
        Math.random() * 2 - 1
      ).normalize();

      randomDirection = { 
        direction,
        timeSinceLastUpdate: 0
      }

      entity.add(RandomDirection(randomDirection))
      return;
    }

    randomDirection.timeSinceLastUpdate += delta;

    if (randomDirection.timeSinceLastUpdate >= RANDOM_DIRECTION_UPDATE_INTERVAL) {
      const randomAngle = (Math.random() * 2 - 1) * MAX_TURN_ANGLE;

      const q = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), randomAngle);

      const newDirection = randomDirection.direction.clone().applyQuaternion(q).normalize();

      randomDirection.direction.copy(newDirection);
      randomDirection.timeSinceLastUpdate = 0;
    }

    entity.set(RandomDirection, randomDirection);
  })
}

export const FaceAntsTowardTarget = ({ world }: { world: World }) => {
  world.query(Position, Direction, Targeting('*'), IsAnt).updateEach(([ pos, dir ], entity) => {

    const target = entity.targetFor(Targeting);
    const targetPos = target?.get(Position);

    if (!target || !targetPos) return;

    // Calculate direction vector from rotation
    const direction = calculateDirection(new Vector3(pos.x, 0, pos.z), new Vector3(targetPos.x, 0, targetPos.z));

    dir.desired = direction;
  });
}
