import { World } from "koota";
import { Quaternion, Vector3 } from "three";

import { IsAnt, IsFood, MeshRef, Position, Targeting } from "./traits";

// for demo purposes we store all systems in a single file

// =====================================================================================================================
// =====================================================================================================================

/**
 * Update position of three.js meshes to reflect value of Position trait values 
 */
export const SyncPositionToThree = ({ world }: { world: World }) => {
  world.query(Position, MeshRef).updateEach(([pos, { ref: mesh }]) => {
    // sync back to three
    mesh.position.copy(pos);
  });
}

// =====================================================================================================================
// =====================================================================================================================


// =====================================================================================================================
// =====================================================================================================================


/**
 * how do ants obtain a target?
 * * check for food source?
 * * * if ant does not have target, check for a food source. If no food source, don't move.
 * 
 * ants need to move toward a target
 * * query for ants with a target
 * * compare positions to set a direction
 */



// query ants
// query food
// for each ant assign the closest food item as a target

const getDistance2D = (pos1: { x: number, z: number }, pos2: { x: number, z: number }): number => {
  const dx = pos1.x - pos2.x;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dz * dz);
};

export const FindFood = ({ world }: { world: World }) => {
  const food = world.query(Position, IsFood);

  if (food.length === 0) return;

  // use in place of world.query().forEach() for performance intensive operations
  for (const entity of world.query(Position, IsAnt)) {
    const pos = entity.get(Position);
    // TODO: is this how we should interact with traits when we need a reference to the entity as well? It shouldn't be possible for pos to not exist.
    if (!pos) return;

    let closestFood = null;
    let closestDistance = Infinity;

    for (const f of food) {
      const foodPos = f.get(Position);
      if (!foodPos) continue;

      const distance = getDistance2D({ x: pos.x, z: pos.z }, { x: foodPos.x, z: foodPos.z })

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

const calculateDirection = (from: Vector3, to: Vector3) => {
  const direction = new Vector3(to.x - from.x, to.y - from.y, to.z - from.z);
  return direction.normalize();
}

export const MoveAntsToTarget = ({ world, delta }: { world: World, delta: number }) => {
  world.query(Position, MeshRef, Targeting('*'), IsAnt).updateEach(([ pos, meshRef ], entity) => {
    const mesh = meshRef.ref;

    if (!mesh) return;

    const target = entity.targetFor(Targeting);
    const targetPos = target?.get(Position);

    if (!targetPos) return;

    // Calculate direction vector from rotation
    const direction = calculateDirection(new Vector3(pos.x, 0, pos.z), new Vector3(targetPos.x, 0, targetPos.z));

    const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), direction)
    mesh.quaternion.copy(quaternion);
    // direction.applyQuaternion(mesh.quaternion); // Apply rotation to get world direction

    // Update position to move in the direction of the rotation
    const speed = 2;
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
