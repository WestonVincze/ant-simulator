import { createAdded, Not, World } from "koota";
import { AnimationRef, Direction, IsColony, MeshRef, Position, Static } from "../traits";
import { getAnthillHeight } from "../../constants";

const Added = createAdded();

export const SyncPositionToThree = ({ world }: { world: World }) => {
  const colony = world.queryFirst(Position, IsColony);
  const colonyPos = colony?.get(Position);

  // static entities 
  world.query(Added(Position, MeshRef, Static)).updateEach(([ pos, { ref: mesh }]) => {
    mesh.position.copy(pos);
  })

  world.query(Position, Direction, MeshRef, Not(Static)).updateEach(([pos, dir, { ref: mesh }]) => {
    mesh.position.copy(pos);

    const lookAhead = 1.5;
    const target = pos.clone().add(dir.current.clone().multiplyScalar(lookAhead));

    if (colonyPos) {
      const aDx = target.x - colonyPos.x;
      const aDz = target.z - colonyPos.z;
      const aDist = Math.sqrt(aDx * aDx + aDz * aDz);
      target.y = getAnthillHeight(aDist);
    }

    mesh.lookAt(target);
  });

  world.query(Position, MeshRef, Not(Static, Direction)).updateEach(( [pos, { ref: mesh } ]) => {
    mesh.position.copy(pos);
  })
}

export const HandleAnimations = ({ world, delta }: { world: World, delta: number }) => {
  world.query(AnimationRef).updateEach(([ ref ]) => {
    ref.mixer?.update(delta);
  });
}
