import { World } from "koota";
import RBush from "rbush";
import { Object3D } from "three";

import { Carrying, Direction, FoodPheromoneMeshRef, HomePheromoneMeshRef, Pheromone, PheromoneSpawner, Position, Sensors, Static } from "../traits";
import { getSensorWorldPositions, rotateVector } from "../../utils";

export const pheromoneMap = new Map();
export const pheromoneTree = new RBush<{ entityId: number, type: string, stepsFromGoal: number }>();

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
  world.query(Position, Direction, Sensors).updateEach(([ pos, dir, sensors ]) => {
    // calculate position of sensors
    const sensorPos = getSensorWorldPositions(pos, dir.current, {
      front: sensors.frontOffset,
      left: sensors.leftOffset,
      right: sensors.rightOffset
    })

    let lowestStepCount = Infinity;
    let bestDirection = "forward";

    // count pheromones in each sensor
    const frontPheromones = pheromoneTree.search({
      minX: sensorPos.front.x - sensors.radius,
      minY: sensorPos.front.z - sensors.radius,
      maxX: sensorPos.front.x + sensors.radius,
      maxY: sensorPos.front.z + sensors.radius 
    })
      .filter(item => item.type === sensors.lookingFor)
      .forEach(item => {
        if (item.stepsFromGoal <= lowestStepCount) {
          lowestStepCount = item.stepsFromGoal;
          bestDirection = "forward";
        }
      })

    const leftPheromones = pheromoneTree.search({
      minX: sensorPos.left.x - sensors.radius,
      minY: sensorPos.left.z - sensors.radius,
      maxX: sensorPos.left.x + sensors.radius,
      maxY: sensorPos.left.z + sensors.radius 
    })
      .filter(item => item.type === sensors.lookingFor)
      .forEach(item => {
        if (item.stepsFromGoal <= lowestStepCount) {
          lowestStepCount = item.stepsFromGoal;
          bestDirection = "left";
        }
      })

    const rightPheromones = pheromoneTree.search({
      minX: sensorPos.right.x - sensors.radius,
      minY: sensorPos.right.z - sensors.radius,
      maxX: sensorPos.right.x + sensors.radius,
      maxY: sensorPos.right.z + sensors.radius 
    })
      .filter(item => item.type === sensors.lookingFor)
      .forEach(item => {
        if (item.stepsFromGoal <= lowestStepCount) {
          lowestStepCount = item.stepsFromGoal;
          bestDirection = "right";
        }
      })

    // default to forward
    let desired = dir.current.clone();

    /*
    if (
      leftPheromones.length > frontPheromones.length &&
      leftPheromones.length > rightPheromones.length
    ) {
      // turn left
      desired = rotateVector(dir.current, +Math.PI / 4);
    } else if (
      rightPheromones.length > leftPheromones.length &&
      rightPheromones.length > frontPheromones.length
    ) {
      // turn right
      desired = rotateVector(dir.current, -Math.PI / 4);
    }
    */

    if (bestDirection === "left") {
      desired = rotateVector(dir.current, +Math.PI / 4);
    } else if (bestDirection === "right") {
      desired = rotateVector(dir.current, -Math.PI / 4);
    }

    dir.desired.copy(desired.normalize());
  })

  world.query()
}

/**
 * FOLLOW PHEROMONE TRAILS
 * detect pheromones in range and decide whether to follow them
 * first detect all pheromones in range
 * calculate the direction with the most pheromones?
 */


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
      const pheromone = {
        minX: pos.x,
        minY: pos.z,
        maxX: pos.x,
        maxY: pos.z,
        entityId: pheromoneEntity.id(),
        type,
        stepsFromGoal: spawner.stepCount
      }
      pheromoneMap.set(pheromoneEntity.id(), pheromone);
      pheromoneTree.insert(pheromone)
      spawner.timeSinceLastSpawn = 0;
    }
  });
}

export const DegradePheromones = ({ world, delta }: { world: World, delta: number }) => {
  /*
  const UPDATE_INTERVAL = 1;

  let timeSinceLastUpdate = 0;
  */

  const pheromones = world.query(Pheromone)

  pheromones.updateEach(([ pheromone ], entity) => {
    /*
    timeSinceLastUpdate += delta;

    if (timeSinceLastUpdate < UPDATE_INTERVAL) return;

    timeSinceLastUpdate = 0;
    */

    pheromone.intensity -= .01 * delta;
    /* remove opacity for now
    const mesh = meshRef.ref;
    if (mesh && pheromone.intensity ) {
      const material = mesh.material as MeshStandardMaterial;
      material.opacity = Math.max(pheromone.intensity, 0);
    }
    */

    if (pheromone.intensity <= 0) {
      pheromoneTree.remove(pheromoneMap.get(entity.id()));
      pheromoneMap.delete(entity.id());

      entity?.destroy();
    }
  });
}