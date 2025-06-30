import { createWorld, World, createActions } from "koota";
import { Schedule } from "directed";

import { DropOffFood, FaceAntsTowardTarget, FindFood, HandleMove, HandleRotation, ScoutForFood, SyncCarriedFoodPosition, SyncFoodManager, SyncPositionToThree } from "./systems";
import { Direction, IsAnt, IsColony, IsFood, Move, Pheromone, PheromoneSpawner, Position, Sensors, Static } from "./traits";
import { Vector3 } from "three";
import { DegradePheromones, DetectPheromones, LeavePheromoneTrail, RenderPheromones } from "./systems/pheromones";

// create our world
export const world = createWorld();

// create a default schedule (we can control what data it passes into systems)
export const schedule = new Schedule<{ world: World, delta: number }>();

// import all ecs systems and build the schedule
schedule.add(SyncFoodManager, { before: DetectPheromones });
schedule.add(DetectPheromones, { before: FindFood });
schedule.add(FindFood, { before: HandleMove });
schedule.add(ScoutForFood, { after: FindFood })
schedule.add(FaceAntsTowardTarget, { after: FindFood });
schedule.add(DropOffFood, { after: FaceAntsTowardTarget });
schedule.add(HandleMove);
schedule.add(LeavePheromoneTrail, { after: HandleMove })
schedule.add(HandleRotation), { before: SyncPositionToThree };
schedule.add(SyncPositionToThree, { after: LeavePheromoneTrail });
schedule.add(SyncCarriedFoodPosition, { before: SyncPositionToThree});
schedule.add(DegradePheromones, { before: SyncPositionToThree });
schedule.add(RenderPheromones, { after: SyncPositionToThree });
schedule.build();

world.spawn(IsColony, Position(new Vector3(0, 2.5, 0)), Static);

// an example actions store to be used from within React.
// Creating action stores is optional – we can execute the code directly –
// but it can help us with organization.

export const exampleActions = createActions((world: World) => ({
  spawnAnt: () => {
   const direction = new Vector3(Math.random() * 2 - 1, 0, Math.random() * 2 - 1)
    world.spawn(
      IsAnt,
      Position(new Vector3(0, 0, 0)),
      Direction({
        current: direction.clone(),
        desired: new Vector3(0, 0, 1),
      }),
      PheromoneSpawner({ timeSinceLastSpawn: 0 }),
      Move({ speed: 3 }),
      Sensors({
        frontOffset: new Vector3(0, 0, 5),
        leftOffset: new Vector3(4, 0, 3),
        rightOffset: new Vector3(-4, 0, 3),
        radius: 1.75,
        lookingFor: "food"
      })
    )
  },

  removeAnt: () => {
    world.queryFirst(IsAnt)?.destroy();
  },

  spawnFood: (x: number = Math.random() * 100 - 50, y: number = 0.5, z: number = Math.random() * 100 - 50) => {
    world.spawn(IsFood, Position(new Vector3(x, y, z)));
  },

  removeFood: () => {
    world.queryFirst(IsFood)?.destroy();
  },

  spawnPheromone: (x: number, y: number, z: number) => {
    const pheromoneEntity = world.spawn(Pheromone({ intensity: 1, type: "food" }), Position(new Vector3(x, y, z)), Static)
    const pheromone = {
      minX: x,
      minY: z,
      maxX: x,
      maxY: z,
      entityId: pheromoneEntity.id(),
      type: "food",
      stepsFromGoal: 0 // for now
    }

    // pheromoneMap.set(pheromoneEntity.id(), pheromone);
    // pheromoneTree.insert(pheromone);
  }
}));
