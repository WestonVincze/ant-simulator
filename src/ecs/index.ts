import { createWorld, World, createActions } from "koota";
import { Schedule } from "directed";

import { DropOffFood, FindFood, HandleMove, HandleRotation, ScoutForFood, SyncCarriedFoodPosition, SyncPositionToThree } from "./systems";
import { Direction, IsAnt, IsColony, IsFood, Move, Pheromone, PheromoneSpawner, Position, Static } from "./traits";
import { Vector3 } from "three";
import { DegradePheromones, DetectPheromones, LeavePheromoneTrail } from "./systems/pheromones";

// create our world
export const world = createWorld();

// create a default schedule (we can control what data it passes into systems)
export const schedule = new Schedule<{ world: World, delta: number }>();

// import all ecs systems and build the schedule
schedule.add(DetectPheromones, { before: FindFood });
schedule.add(FindFood, { before: HandleMove });
schedule.add(DropOffFood, { after: FindFood });
schedule.add(ScoutForFood, { after: FindFood })
// schedule.add(MoveAntsToTarget);
schedule.add(HandleMove);
schedule.add(LeavePheromoneTrail, { after: HandleMove })
schedule.add(HandleRotation), { before: SyncPositionToThree };
schedule.add(SyncPositionToThree, { after: LeavePheromoneTrail });
schedule.add(SyncCarriedFoodPosition, { before: SyncPositionToThree});
schedule.add(DegradePheromones, { before: SyncPositionToThree });
schedule.build();

world.spawn(IsColony, Position(new Vector3(0, 2.5, 0)), Static);

// an example actions store to be used from within React.
// Creating action stores is optional – we can execute the code directly –
// but it can help us with organization.

export const exampleActions = createActions((world: World) => ({
  spawnAnt: () => {
    const x = Math.random() * 70 - 35;
    const z = Math.random() * 70 - 35;
    world.spawn(
      IsAnt,
      Position(new Vector3(x, 0, z)),
      Direction(),
      PheromoneSpawner({ timeSinceLastSpawn: 0 }),
      Move(),
    )
  },

  removeAnt: () => {
    world.queryFirst(IsAnt)?.destroy();
  },

  spawnFood: () => {
    const x = Math.random() * 100 - 50;
    const z = Math.random() * 100 - 50;
    world.spawn(IsFood, Position(new Vector3(x, 0.5, z)));
  },

  removeFood: () => {
    world.queryFirst(IsFood)?.destroy();
  },

  spawnPheromone: (x: number, y: number, z: number) => {
    world.spawn(Pheromone({ intensity: 1, type: "food" }), Position(new Vector3(x, y, z)), Static)
  }
}));
