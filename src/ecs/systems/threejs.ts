import { createAdded, Not, World } from "koota";
import { AnimationRef, Direction, MeshRef, Position, Static } from "../traits";

const Added = createAdded();

export const SyncPositionToThree = ({ world }: { world: World }) => {
  // static entities 
  world.query(Added(Position, MeshRef, Static)).updateEach(([ pos, { ref: mesh }]) => {
    mesh.position.copy(pos);
  })

  world.query(Position, Direction, MeshRef, Not(Static)).updateEach(([pos, dir, { ref: mesh }]) => {
    // sync back to three
    mesh.position.copy(pos);
    const target = pos.clone().add(dir.current);
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
