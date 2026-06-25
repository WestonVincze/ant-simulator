import { createAdded, Not, World } from "koota";
import { CarriedBy, Carrying, Direction, InColony, IsAnt, IsColony, IsFood, Move, PheromoneSpawner, Position, Sensors, Targeting } from "../traits";
import { getDistance2D } from "../../utils";
import { SpatialManager } from "../../spatialTrees/SpatialManager";
import { ANTHILL, getAnthillHeight } from "../../constants";

const foodManager = new SpatialManager<{ value: number }>();

const Added = createAdded();

export const SyncFoodManager = ({ world }: { world: World }) => {
  world.query(Added(IsFood, Position)).forEach(entity => {
    const pos = entity.get(Position);
    if (!pos) return;

    foodManager.addItem(entity, pos, { value: 1 })
  })

  // remove food from foodManager once it is carried by an ant
  world.query(Added(CarriedBy("*"))).forEach(entity => {
    foodManager.removeItem(entity.id());
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
        entity.set(Direction, { ...dir, desired: dir?.current.clone().multiplyScalar(-1) })

        const move = entity.get(Move);
        entity.set(Move, { ...move, currentSpeed: 0 });

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

    if (distance < 2) {
      entity.remove(Targeting("*"));
      entity.remove(Carrying("*"));
      const food = entity.targetFor(Carrying);
      food?.remove(CarriedBy("*"));
      food?.add(InColony);
      const foodPos = food?.get(Position);
      if (foodPos) {
        foodPos.y -= ANTHILL.height / 2;
      }

      const sensors = entity.get(Sensors);
      if (sensors) {
        sensors.lookingFor = "food";
      }

      const pheromoneSpawner = entity.get(PheromoneSpawner);
      if (pheromoneSpawner) {
        pheromoneSpawner.stepCount = 0;
      }

      const dir = entity.get(Direction);
      if (dir) {
        dir.desired.copy(dir.current.clone().multiplyScalar(-1));
      }

      const move = entity.get(Move);
      if (move) {
        move.currentSpeed = 0.5;
      }
      return;
    }

    if (!entity.has(Targeting(colony)) && distance < COLONY_DETECTION_RANGE) {
      entity.add(Targeting(colony));
    }
  })
}

export const SyncCarriedFoodPosition = ({ world, delta }: { world: World, delta: number }) => {
  const colony = world.queryFirst(Position, IsColony);
  const colonyPos = colony?.get(Position);

  world.query(Position, CarriedBy("*"), IsFood).updateEach(([ pos ], entity) => {
    const ant = entity.targetFor(CarriedBy);
    const antPosition = ant?.get(Position);
    const antDirection = ant?.get(Direction);

    if (!antPosition || !antDirection?.current) return;

    const offset = antDirection.current.clone().multiplyScalar(1.5);

    pos.x = antPosition.x + offset.x;
    pos.z = antPosition.z + offset.z;

    let yOffset = 0.5;
    // if ant is at colony, food must rotate to stay in its mandibles
    if (colonyPos) {
      const dx = antPosition.x - colonyPos.x;
      const dz = antPosition.z - colonyPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const aDx = pos.x - colonyPos.x;
      const aDz = pos.z - colonyPos.z;
      const aDist = Math.sqrt(aDx * aDx + aDz * aDz);
      yOffset += getAnthillHeight(aDist) - getAnthillHeight(dist);
    }
    pos.y = antPosition.y + yOffset;
  });
}
