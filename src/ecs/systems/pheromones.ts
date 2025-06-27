import { World } from "koota";
import RBush from "rbush";

import { Carrying, Direction, MeshRef, Pheromone, PheromoneSpawner, Position, Sensors, Static } from "../traits";
import { getSensorWorldPositions, rotateVector } from "../../utils";

const pheromoneMap = new Map();
const pheromoneTree = new RBush<{ entityId: number, type: string }>();

/**
 * create three sensors in front of the ant
 * each sensor will check for all pheromones in range
 * whichever sensor has the highest value for the pheromone we're trying to detect controls the direction that the ant will travel (left, forward, or right)
 *    O <----.
 * O     O <-- sensors
 *    A
 *    N
 *    T
 * 
 * 
 * SYSTEM DESIGN:
 * each sensor has a input command, output command, position, and a net value
 * each ant will have a relation with three sensors
 * 
 */

export const DetectPheromones = ({ world }: { world: World }) => {
  // count pheromones in each ant's sensor
  world.query(Position, Direction, Sensors).updateEach(([ pos, dir, sensor ]) => {
    // calculate position of sensors
    const sensorPos = getSensorWorldPositions(pos, dir.current, {
      front: sensor.frontOffset,
      left: sensor.leftOffset,
      right: sensor.rightOffset
    })

    // count pheromones in each sensor
    const frontPheromones = pheromoneTree.search({
      minX: sensorPos.front.x - sensor.radius,
      minY: sensorPos.front.z - sensor.radius,
      maxX: sensorPos.front.x + sensor.radius,
      maxY: sensorPos.front.z + sensor.radius 
    }).filter(item => item.type === sensor.lookingFor);

    const leftPheromones = pheromoneTree.search({
      minX: sensorPos.left.x - sensor.radius,
      minY: sensorPos.left.z - sensor.radius,
      maxX: sensorPos.left.x + sensor.radius,
      maxY: sensorPos.left.z + sensor.radius 
    }).filter(item => item.type === sensor.lookingFor);


    const rightPheromones = pheromoneTree.search({
      minX: sensorPos.right.x - sensor.radius,
      minY: sensorPos.right.z - sensor.radius,
      maxX: sensorPos.right.x + sensor.radius,
      maxY: sensorPos.right.z + sensor.radius 
    }).filter(item => item.type === sensor.lookingFor);

    // default to forward
    let desired = dir.current.clone();

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
  const PHEROMONE_DROP_INTERVAL = 0.3;

  world.query(PheromoneSpawner, Position).updateEach(([ spawner, pos ], entity) => {
    spawner.timeSinceLastSpawn += delta

    if (spawner.timeSinceLastSpawn >= PHEROMONE_DROP_INTERVAL) {
      const type = entity.has(Carrying("*")) ? "food" : "home";
      world.spawn(Pheromone({ intensity: 1, type }), Position(pos.clone()), Static);
      const pheromone = {
        minX: pos.x,
        minY: pos.z,
        maxX: pos.x,
        maxY: pos.z,
        entityId: entity.id(),
        type
      }
      pheromoneMap.set(entity.id, pheromone);
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

  const pheromones = world.query(Pheromone, MeshRef)

  pheromones.updateEach(([ pheromone ], entity) => {
    /*
    timeSinceLastUpdate += delta;

    if (timeSinceLastUpdate < UPDATE_INTERVAL) return;

    timeSinceLastUpdate = 0;
    */

    pheromone.intensity -= 0.05 * delta;
    /* remove opacity for now
    const mesh = meshRef.ref;
    if (mesh && pheromone.intensity ) {
      const material = mesh.material as MeshStandardMaterial;
      material.opacity = Math.max(pheromone.intensity, 0);
    }
      */

    if (pheromone.intensity <= 0) {
      entity?.destroy();

      pheromoneTree.remove(pheromoneMap.get(entity.id));
      pheromoneMap.delete(entity.id);
    }
  });
}