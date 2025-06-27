import { createAdded, Not, World } from "koota";
import { Quaternion, Vector3 } from "three";

import { CarriedBy, Carrying, Direction, IsAnt, IsColony, IsFood, MeshRef, Move, Position, RandomDirection, Static, Targeting } from "./traits";

// for demo purposes we store all systems in a single file

/**
 * Update position of three.js meshes to reflect value of Position trait values 
 */
const Added = createAdded();

export const SyncPositionToThree = ({ world }: { world: World }) => {
  // static entities 
  world.query(Added(Position, MeshRef, Static)).updateEach(([ pos, { ref: mesh }]) => {
    console.log("static asset added")
    mesh.position.copy(pos);
  })

  world.query(Position, Direction, MeshRef, Not(Static)).updateEach(([pos, dir, { ref: mesh }]) => {
    // sync back to three
    mesh.position.copy(pos);
    const target = pos.clone().add(dir.current);
    mesh.lookAt(target);
  });
}

const getDistance2D = (pos1: { x: number, z: number }, pos2: { x: number, z: number }): number => {
  const dx = pos1.x - pos2.x;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dz * dz);
};

export const FindFood = ({ world }: { world: World }) => {
  const FOOD_DETECTION_RANGE = 10;

  const food = world.query(Position, IsFood, Not(CarriedBy("*")));
  const colony = world.queryFirst(Position, IsColony);

  if (food.length === 0 || !colony) return;

  // use in place of world.query().forEach() for performance intensive operations
  for (const entity of world.query(Position, IsAnt, Not(Carrying("*")))) {
    const pos = entity.get(Position);
    // TODO: is this how we should interact with traits when we need a reference to the entity as well? It shouldn't be possible for pos to not exist.
    if (!pos) return;

    let closestFood = null;
    let closestDistance = Infinity;

    const target = entity.targetFor(Targeting);
    const targetCarrier = target?.targetFor(CarriedBy);

    if (targetCarrier && targetCarrier.id !== entity.id) {
      entity.remove(Targeting("*"));
    }

    for (const f of food) {
      const foodPos = f.get(Position);
      if (!foodPos) continue;

      const distance = getDistance2D({ x: pos.x, z: pos.z }, { x: foodPos.x, z: foodPos.z })

      if (distance > FOOD_DETECTION_RANGE) continue;

      // if a food item is in range, pick it up and kill the loop
      if (distance < 5) {
        console.log("PICK IT UP");

        // TODO: does it make sense to use both held and held by?
        entity.add(Carrying(f));
        f.add(CarriedBy(entity));
        entity.add(Targeting(colony));
        return;
      }

      if (distance < closestDistance) {
        closestDistance = distance;
        closestFood = f;
      }
    }

    if (closestFood) {
      entity.add(Targeting(closestFood))
    }
  }
}

export const DropOffFood = ({ world }: {world: World }) => {
  const colony = world.queryFirst(Position, IsColony);

  if (!colony) return;

  world.query(Position, IsAnt, Carrying("*"), Targeting(colony)).forEach(entity => {
    const target = entity.targetFor(Targeting);
    const targetPos = target?.get(Position);
    const pos = entity.get(Position);

    if (!targetPos || !pos) return;

    const distance = getDistance2D({ x: pos.x, z: pos.z }, { x: targetPos.x, z: targetPos.z })

    if (distance < 3) {
      entity.remove(Targeting("*"));
      entity.remove(Carrying("*"));
      const food = entity.targetFor(Carrying);
      food?.remove(CarriedBy("*"));
      food?.remove(IsFood);
    }
  })
}

const calculateDirection = (from: Vector3, to: Vector3) => {
  const direction = new Vector3(to.x - from.x, to.y - from.y, to.z - from.z);
  return direction.normalize();
}

export const SyncCarriedFoodPosition = ({ world, delta }: { world: World, delta: number }) => {
  world.query(Position, CarriedBy("*"), IsFood).updateEach(([ pos ], entity) => {
    const ant = entity.targetFor(CarriedBy);
    const antPosition = ant?.get(Position);

    if (!antPosition) return;

    // TODO: compensate for rotation of ant as well
    pos.x = antPosition.x;
    pos.y = antPosition.y;
    pos.z = antPosition.z;
  });
}


// ants move "randomly" when they don't have a target
export const ScoutForFood = ({ world, delta }: { world: World, delta: number }) => {
  const RANDOM_DIRECTION_UPDATE_INTERVAL = 1;
  const SCOUT_SPEED = 4;
  const MAX_TURN_ANGLE = Math.PI / 6;
  const ROTATION_SPEED = 2;

  world.query(Position, Direction, MeshRef, IsAnt, Not(Targeting("*"))).updateEach(([ pos, dir, meshRef ], entity) => {
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

    dir.desired.copy(randomDirection.direction);


    /*
    const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), randomDirection.direction);
    meshRef.ref.quaternion.slerp(quaternion, ROTATION_SPEED * delta);

    pos.x += randomDirection.direction.x * SCOUT_SPEED * delta;
    pos.z += randomDirection.direction.z * SCOUT_SPEED * delta;
    */
  })
}

export const HandleRotation = ({ world, delta }: { world: World, delta: number }) => {
  world.query(Direction).updateEach(([ dir ]) => {
    dir.current.lerp(dir.desired, 0.01).normalize();
  })
}

export const HandleMove = ({ world, delta }: { world: World, delta: number }) => {
  world.query(Position, Direction, Move).updateEach(([ pos, dir, move ]) => {
    pos.x += dir.current.x * move.speed * delta;
    pos.y += dir.current.y * move.speed * delta;
    pos.z += dir.current.z * move.speed * delta;
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

/* SYSTEMS FROM ORIGINAL EXAMPLE

// this system demos some movement. in a real game our physics, AI, character controller, w/e
// would be setting the position

let elapsedTime = 0;
const Added = createAdded();
const SpawnTime = trait({current: 0});
export const AnimateSpheres = ({world, delta}: { world: World, delta: number }) => {

  elapsedTime += delta;

  world.query(Added(IsAnt)).updateEach((_, entity) => {
    entity.add(SpawnTime({current: elapsedTime * 1.1}))
  });

  world.query(Position, SpawnTime, IsAnt).updateEach(([pos, spawnTime]) => {
    const T = spawnTime.current + elapsedTime;
    const scale = 2 / (3 - Math.cos(T));
    pos.x = -7 + scale * Math.cos(T) * 25;
    pos.z = scale * Math.sin(T) * 12.5;
    pos.y = 2 * Math.cos(T) * Math.sin(T / 2) * 10;
  });

// =====================================================================================================================
// =====================================================================================================================


// this system will animate the colors based on position

const orange = [255, 100, 0];
const violet = [148, 0, 211];

export const AnimateColors = ({world}: { world: World }) => {

  world.query(Position, MeshRef).updateEach(([pos, {ref: mesh}]) => {

    const distFromOrigin = mapLinear(Math.hypot(pos.x, pos.y, pos.z), 0, 25, 0, 1);
    const r = orange[0] * distFromOrigin + (1 - distFromOrigin) * violet[0];
    const g = orange[1] * distFromOrigin + (1 - distFromOrigin) * violet[1];
    const b = orange[2] * distFromOrigin + (1 - distFromOrigin) * violet[2];

    (mesh.material as MeshStandardMaterial).color.set(r / 255, g / 255, b / 255);
  });

}
*/
