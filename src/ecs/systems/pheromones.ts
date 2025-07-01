import { Not, World } from "koota";
import { Object3D } from "three";

import { Carrying, Direction, FoodPheromoneMeshRef, HomePheromoneMeshRef, Pheromone, PheromoneSpawner, Position, Sensors, Static, Targeting } from "../traits";
import { getSensorWorldPositions, rotateVector } from "../../utils";
import { SpatialManager } from "../../spatialTrees/SpatialManager";

const pheromoneManager = new SpatialManager<{ type: string, stepsFromGoal: number}>();

const dummy = new Object3D();

export const RenderPheromones = ({ world }: { world: World }) => {
  const food = world.get(FoodPheromoneMeshRef);
  const home = world.get(HomePheromoneMeshRef);

  if (!food?.ref || !home?.ref) {
    console.warn("InstanceMesh for food or home pheromones is missing.")
    return;
  }

  const pheromones = world.query(Position, Pheromone);

  if (pheromones.length === 0) return;

  const foodPheromones = pheromones.filter(p => p.get(Pheromone)?.type === "food");

  const homePheromones = pheromones.filter(p => p.get(Pheromone)?.type === "home")
  
  foodPheromones.forEach((entity, i) => {
    const pos = entity.get(Position)!;

    dummy.position.set(pos.x, 0.5, pos.z);
    dummy.updateMatrix();

    food?.ref?.setMatrixAt(i, dummy.matrix);
  })

  food.ref.count = foodPheromones.length;
  food.ref.instanceMatrix.needsUpdate = true;

  homePheromones.forEach((entity, i) => {
    const pos = entity.get(Position)!;

    dummy.position.set(pos.x, 0.5, pos.z);
    dummy.updateMatrix();

    home?.ref?.setMatrixAt(i, dummy.matrix);
  })

  home.ref.count = homePheromones.length;
  home.ref.instanceMatrix.needsUpdate = true;

}

export const DetectPheromones = ({ world }: { world: World }) => {
  // count pheromones in each ant's sensor
  world.query(Position, Direction, Sensors, Not(Targeting("*"))).updateEach(([ pos, dir, sensors ]) => {
    // calculate position of sensors
    const sensorPos = getSensorWorldPositions(pos, dir.current, {
      front: sensors.frontOffset,
      left: sensors.leftOffset,
      right: sensors.rightOffset
    })

    // count pheromones in each sensor
    const forwardValue = pheromoneManager.query(sensorPos.front, sensors.radius)
      .filter(item => item.data.type === sensors.lookingFor)
      .reduce((prev, curr) =>
        curr.data.stepsFromGoal > 0 ? prev += 1 / curr.data.stepsFromGoal : 2,
      0);

    const leftValue =pheromoneManager.query(sensorPos.left, sensors.radius)
      .filter(item => item.data.type === sensors.lookingFor)
      .reduce((prev, curr) =>
        curr.data.stepsFromGoal > 0 ? prev += 1 / curr.data.stepsFromGoal : 2,
      0);

    const rightValue = pheromoneManager.query(sensorPos.right, sensors.radius)
      .filter(item => item.data.type === sensors.lookingFor)
      .reduce((prev, curr) =>
        curr.data.stepsFromGoal > 0 ? prev += 1 / curr.data.stepsFromGoal : 2,
      0);

    // default to forward
    let desired = dir.desired.clone();

    if (leftValue > rightValue && leftValue > forwardValue) {
      desired = rotateVector(dir.current, +Math.PI / 4);
    } else if (rightValue > leftValue && rightValue > forwardValue) {
      desired = rotateVector(dir.current, -Math.PI / 4);
    }

    dir.desired.copy(desired.normalize());
  })

  world.query()
}

export const LeavePheromoneTrail = ({ world, delta }: { world: World, delta: number }) => {
  const PHEROMONE_DROP_INTERVAL = 0.5;

  world.query(PheromoneSpawner, Position).updateEach(([ spawner, pos ], entity) => {
    spawner.timeSinceLastSpawn += delta;

    if (spawner.timeSinceLastSpawn >= PHEROMONE_DROP_INTERVAL) {
      // TODO: reset step count when changing pheromone type
      spawner.stepCount += 1;
      // TODO: move type to pheromoneSpawner prop
      const type = entity.has(Carrying("*")) ? "food" : "home";
      const pheromoneEntity = world.spawn(
        Pheromone({
          intensity: 1,
          stepsFromGoal: spawner.stepCount,
          type
        }),
        Position(pos.clone()),
        Static
      );

      pheromoneManager.addItem(
        pheromoneEntity,
        pos,
        { type, stepsFromGoal: spawner.stepCount }
      )

      spawner.timeSinceLastSpawn = 0;
    }
  });
}

export const DegradePheromones = ({ world, delta }: { world: World, delta: number }) => {
  const pheromones = world.query(Pheromone)

  pheromones.updateEach(([ pheromone ], entity) => {

    pheromone.intensity -= .01 * delta;

    if (pheromone.intensity <= 0) {
      pheromoneManager.removeItem(entity.id());

      entity?.destroy();
    }
  });
}
