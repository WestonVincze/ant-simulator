import { createAdded, Not, World } from "koota";
import { CarriedBy, Carrying, Direction, IsAnt, IsColony, IsFood, MeshRef, PheromoneSpawner, Position, RandomDirection, Sensors, Targeting } from "../traits";
import { Quaternion, Vector3 } from "three";
import { getDistance2D } from "../../utils";
import { SpatialManager } from "../../spatialTrees/SpatialManager";

const foodManager = new SpatialManager<{ value: number }>();

const Added = createAdded();

export const SyncFoodManager = ({ world }: { world: World }) => {
  world.query(Added(IsFood, Position)).forEach(entity => {
    const pos = entity.get(Position);
    if (!pos) return;

    foodManager.addItem(entity, pos, { value: 1 })
    // console.log(foodManager.queryItem(new Vector3, 1000));
  })

  // remove food from foodManager once it is carried by an ant
  world.query(Added(CarriedBy("*"))).forEach(entity => {
    foodManager.removeItem(entity.id());
    // console.log(foodManager.queryItem(new Vector3, 1000));
  })
}

export const FindFood = ({ world }: { world: World }) => {
  const FOOD_DETECTION_RANGE = 10;
  const FOOD_PICKUP_RANGE = 3;

  const colony = world.queryFirst(Position, IsColony);

  if (!colony) return;

  // use in place of world.query().forEach() for performance intensive operations
  for (const entity of world.query(Position, IsAnt, Not(Carrying("*")))) {
    const pos = entity.get(Position);
    if (!pos) return;

    let closestFood = null;
    let closestDistance = Infinity;

    const foodInRange = foodManager.query(pos, FOOD_DETECTION_RANGE);
    for (const food of foodInRange) {
      const foodPos = food.entity.get(Position);
      if (!foodPos) continue;

      const distance = getDistance2D({ x: pos.x, z: pos.z }, { x: foodPos.x, z: foodPos.z })

      // if a food item is in range, pick it up and kill the loop
      if (distance < FOOD_PICKUP_RANGE) {

        // TODO: does it make sense to use both held and held by?
        entity.add(Carrying(food.entity));
        food.entity.add(CarriedBy(entity));
        entity.remove(Targeting("*"));

        // TODO: flip less aggressively
        const dir = entity.get(Direction);
        entity.set(Direction, { ...dir, current: dir?.current.multiplyScalar(-1) })

        const sensors = entity.get(Sensors);
        if (sensors) {
          sensors.lookingFor = "home";
          entity.set(Sensors, sensors);
        }
        const pheromoneSpawner = entity.get(PheromoneSpawner);
        if (pheromoneSpawner) {
          pheromoneSpawner.stepCount = 0;
        }
        return;
      }

      if (distance < closestDistance) {
        closestDistance = distance;
        closestFood = food.entity;
      }
    }

    // if closest food exists and is not already targeted
    if (closestFood && world.query(Targeting(closestFood)).length === 0) {
      entity.add(Targeting(closestFood))
    }
  }
}

export const DropOffFood = ({ world }: {world: World }) => {
  const COLONY_DETECTION_RANGE = 20;
  const colony = world.queryFirst(Position, IsColony);

  if (!colony) return;

  world.query(Position, IsAnt, Carrying("*")).forEach(entity => {
    const targetPos = colony.get(Position);
    const pos = entity.get(Position);

    if (!targetPos || !pos) return;

    const distance = getDistance2D({ x: pos.x, z: pos.z }, { x: targetPos.x, z: targetPos.z })

    if (distance < 5) {
      entity.remove(Targeting("*"));
      entity.remove(Carrying("*"));
      const food = entity.targetFor(Carrying);
      food?.remove(CarriedBy("*"));
      food?.remove(IsFood);

      const sensors = entity.get(Sensors);
      if (sensors) {
        sensors.lookingFor = "food";
        entity.set(Sensors, sensors);
      }

      const pheromoneSpawner = entity.get(PheromoneSpawner);
      if (pheromoneSpawner) {
        pheromoneSpawner.stepCount = 0;
      }

      // TODO: flip less aggressively
      const dir = entity.get(Direction);
      entity.set(Direction, { ...dir, current: dir?.current.multiplyScalar(-1) })
      return;
    }

    if (!entity.has(Targeting(colony)) && distance < COLONY_DETECTION_RANGE) {
      entity.add(Targeting(colony));
    }
  })
}

export const SyncCarriedFoodPosition = ({ world, delta }: { world: World, delta: number }) => {
  world.query(Position, CarriedBy("*"), IsFood).updateEach(([ pos ], entity) => {
    const ant = entity.targetFor(CarriedBy);
    const antPosition = ant?.get(Position);
    const antDirection = ant?.get(Direction);

    if (!antPosition || !antDirection?.current) return;

    const offset = antDirection.current.clone().multiplyScalar(1.5);

    pos.x = antPosition.x + offset.x;
    pos.y = antPosition.y + 0.5;
    pos.z = antPosition.z + offset.z;
  });
}

// ants move "randomly" when they don't have a target
export const ScoutForFood = ({ world, delta }: { world: World, delta: number }) => {
  const RANDOM_DIRECTION_UPDATE_INTERVAL = 1;
  const SCOUT_SPEED = 4;
  const MAX_TURN_ANGLE = Math.PI / 6;
  const ROTATION_SPEED = 2;

  world.query(Position, Direction, MeshRef, IsAnt, Not(Targeting("*"))).updateEach(([ pos, dir, meshRef ], entity) => {
    let randomDirection  = entity.get(RandomDirection);

    if (!randomDirection) {
      const direction = new Vector3(
        Math.random() * 2 - 1,
        0,
        Math.random() * 2 - 1
      ).normalize();

      randomDirection = { 
        direction,
        timeSinceLastUpdate: 0
      }

      entity.add(RandomDirection(randomDirection))
    }

    randomDirection.timeSinceLastUpdate += delta;

    if (randomDirection.timeSinceLastUpdate >= RANDOM_DIRECTION_UPDATE_INTERVAL) {
      const randomAngle = (Math.random() * 2 - 1) * MAX_TURN_ANGLE;

      const q = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), randomAngle);

      const newDirection = randomDirection.direction.clone().applyQuaternion(q).normalize();

      randomDirection.direction.copy(newDirection);
      randomDirection.timeSinceLastUpdate = 0;
    }

    entity.set(RandomDirection, randomDirection);
  })
}
