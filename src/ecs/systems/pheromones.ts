import { Not, World } from "koota";
import { Points } from "three";

import { Carrying, Direction, FoodPheromoneMeshRef, HomePheromoneMeshRef, Pheromone, PheromoneSpawner, Position, Sensors, Static, Targeting } from "../traits";
import { getSensorWorldPositions, rotateVector } from "../../utils";
import { SpatialManager } from "../../spatialTrees/SpatialManager";
import { measure } from "../../perf";

const pheromoneManager = new SpatialManager<{ type: string, stepsFromGoal: number}>();

function writePheromoneBuffer(points: Points, entities: readonly any[]) {
  const geom = points.geometry;
  const posArr = geom.attributes.position.array as Float32Array;
  const intArr = (geom.attributes as any).aIntensity.array as Float32Array;

  for (let i = 0; i < entities.length; i++) {
    const pos = entities[i].get(Position)!;
    const pheromone = entities[i].get(Pheromone)!;
    const i3 = i * 3;
    posArr[i3] = pos.x;
    posArr[i3 + 1] = 0.5;
    posArr[i3 + 2] = pos.z;
    intArr[i] = pheromone.intensity;
  }

  geom.attributes.position.needsUpdate = true;
  geom.attributes.aIntensity.needsUpdate = true;
  geom.setDrawRange(0, entities.length);
}

export const RenderPheromones = ({ world }: { world: World }) => {
  const food = world.get(FoodPheromoneMeshRef);
  const home = world.get(HomePheromoneMeshRef);

  if (!food?.ref || !home?.ref) return;

  const endMeasure = measure(RenderPheromones);

  const pheromones = world.query(Position, Pheromone);

  const foodPheromones = pheromones.filter(p => p.get(Pheromone)?.type === "food");
  const homePheromones = pheromones.filter(p => p.get(Pheromone)?.type === "home");

  writePheromoneBuffer(food.ref, foodPheromones);
  writePheromoneBuffer(home.ref, homePheromones);

  endMeasure();
}

export const DetectPheromones = ({ world }: { world: World }) => {
  const endMeasure = measure(DetectPheromones);
  // count pheromones in each ant's sensor
  world.query(Position, Direction, Sensors, Not(Targeting("*"))).updateEach(([ pos, dir, sensors ]) => {
    // calculate position of sensors
    const sensorPos = getSensorWorldPositions(pos, dir.current, {
      front: sensors.frontOffset,
      left: sensors.leftOffset,
      right: sensors.rightOffset
    })

    const MIN_DETECT_INTENSITY = 0.05;

    const getValue = (sensorPos: any) =>
      pheromoneManager.query(sensorPos, sensors.radius)
        .reduce((sum, item) => {
          const p = item.entity.get(Pheromone);
          if (!p || p.type !== sensors.lookingFor || p.intensity < MIN_DETECT_INTENSITY) return sum;
          return sum + (p.stepsFromGoal > 0 ? 1 / p.stepsFromGoal : 2);
        }, 0);

    const forwardValue = getValue(sensorPos.front);
    const leftValue = getValue(sensorPos.left);
    const rightValue = getValue(sensorPos.right);

    // default to forward
    let desired = dir.desired.clone();

    if (leftValue > rightValue && leftValue > forwardValue) {
      desired = rotateVector(dir.current, +Math.PI / 4);
    } else if (rightValue > leftValue && rightValue > forwardValue) {
      desired = rotateVector(dir.current, -Math.PI / 4);
    }

    dir.desired.copy(desired.normalize());
  })

  endMeasure();
}

export const LeavePheromoneTrail = ({ world, delta }: { world: World, delta: number }) => {
  const PHEROMONE_DROP_INTERVAL = 0.5;
  const endMeasure = measure(LeavePheromoneTrail);

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
  endMeasure();
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
