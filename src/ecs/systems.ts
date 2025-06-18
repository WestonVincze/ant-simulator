import { createAdded, trait, World } from "koota";
import { MeshStandardMaterial, Vector3 } from "three";
import { mapLinear } from "three/src/math/MathUtils";

import { IsAnt, MeshRef, Position } from "./traits";

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


// =====================================================================================================================
// =====================================================================================================================

export const MoveAntsForward = ({ world, delta }: { world: World, delta: number }) => {
  world.query(Position, MeshRef, IsAnt).updateEach(([ pos, meshRef ]) => {
    const mesh = meshRef.ref;

    if (mesh) {
      // Calculate direction vector from rotation
      const direction = new Vector3(0, 0, 1); // Forward direction in local space
      direction.applyQuaternion(mesh.quaternion); // Apply rotation to get world direction

      // Update position to move in the direction of the rotation
      const speed = 2; // Movement speed
      pos.x += direction.x * speed * delta;
      pos.y += direction.y * speed * delta;
      pos.z += direction.z * speed * delta;
    }
  });
}

/* EXAMPLE ONLY

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
*/