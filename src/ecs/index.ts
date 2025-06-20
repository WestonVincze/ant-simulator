import { createWorld, World, createActions } from "koota";
import { Schedule } from "directed";

import { DegradePheromones, DropOffFood, FindFood, LeavePheromoneTrail, MoveAntsToTarget, ScoutForFood, SyncCarriedFoodPosition, SyncPositionToThree } from "./systems";
import { IsAnt, IsFood, PheromoneSpawner, Position } from "./traits";

// create our world
export const world = createWorld();

// create a default schedule (we can control what data it passes into systems)
export const schedule = new Schedule<{ world: World, delta: number }>();

// import all ecs systems and build the schedule
schedule.add(FindFood, { before: MoveAntsToTarget });
schedule.add(DropOffFood, { after: FindFood });
schedule.add(ScoutForFood, { after: FindFood })
schedule.add(MoveAntsToTarget);
schedule.add(LeavePheromoneTrail, { after: MoveAntsToTarget })
schedule.add(SyncPositionToThree, { after: LeavePheromoneTrail });
schedule.add(SyncCarriedFoodPosition, { before: SyncPositionToThree});
schedule.add(DegradePheromones, { before: SyncPositionToThree });
schedule.build();

// an example actions store to be used from within React.
// Creating action stores is optional – we can execute the code directly –
// but it can help us with organization.

export const exampleActions = createActions((world: World) => ({
  spawnAnt: () => {
    const x = Math.random() * 70 - 35;
    const z = Math.random() * 70 - 35;
    world.spawn(
      IsAnt,
      Position({
        x,
        y: 0,
        z,
      }),
      PheromoneSpawner({ timeSinceLastSpawn: 0 })
    )
  },

  removeAnt: () => {
    world.queryFirst(IsAnt)?.destroy();
  },

  spawnFood: () => {
    const x = Math.random() * 100 - 50;
    const z = Math.random() * 100 - 50;
    world.spawn(IsFood, Position({
      x,
      y: 0.5,
      z,
    }))
  },

  removeFood: () => {
    world.queryFirst(IsFood)?.destroy();
  },
}));
