import { createWorld, World, createActions } from "koota";
import { Schedule } from "directed";

import { MoveAntsForward, SyncPositionToThree } from "./systems";
import { IsAnt, Position } from "./traits";

// create our world
export const world = createWorld();

// create a default schedule (we can control what data it passes into systems)
export const schedule = new Schedule<{ world: World, delta: number }>();

// import all ecs systems and build the schedule
schedule.add(MoveAntsForward);
schedule.add(SyncPositionToThree, {after: MoveAntsForward});
schedule.build();

// an example actions store to be used from within React.
// Creating action stores is optional – we can execute the code directly –
// but it can help us with organization.

export const exampleActions = createActions((world: World) => ({
  spawnAnt: () => {
    const x = Math.random() * 70 - 35;
    const z = Math.random() * 70 - 35;
    world.spawn(IsAnt, Position({
      x,
      y: 0,
      z,
    }))
  },

  removeAnt: () => {
    world.queryFirst(IsAnt)?.destroy();
  },
}));
