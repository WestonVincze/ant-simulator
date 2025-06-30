import { Not, World } from "koota";
import { CarriedBy, Carrying, Direction, IsAnt, IsColony, IsFood, MeshRef, PheromoneSpawner, Position, RandomDirection, Sensors, Targeting } from "../traits";
import { Quaternion, Vector3 } from "three";
import { getDistance2D } from "../../utils";

export const FindFood = ({ world }: { world: World }) => {
  const FOOD_DETECTION_RANGE = 10;
  const FOOD_PICKUP_RANGE = 3;

  const food = world.query(Position, IsFood, Not(CarriedBy("*")));
  const colony = world.queryFirst(Position, IsColony);

  if (food.length === 0 || !colony) return;

  // use in place of world.query().forEach() for performance intensive operations
  for (const entity of world.query(Position, IsAnt, Not(Carrying("*")))) {
    const pos = entity.get(Position);
    // TODO: is this how we should interact with traits when we need a reference to the entity as well? It shouldn't be possible for pos to not exist.
    if (!pos) return;

    let closestFood = null;
    let closestDistance = Infinity;

    const target = entity.targetFor(Targeting);
    const targetCarrier = target?.targetFor(CarriedBy);

    if (targetCarrier && targetCarrier.id !== entity.id) {
      entity.remove(Targeting("*"));
    }

    for (const f of food) {
      const foodPos = f.get(Position);
      if (!foodPos) continue;

      const distance = getDistance2D({ x: pos.x, z: pos.z }, { x: foodPos.x, z: foodPos.z })

      if (distance > FOOD_DETECTION_RANGE) continue;

      // if a food item is in range, pick it up and kill the loop
      if (distance < FOOD_PICKUP_RANGE) {

        // TODO: does it make sense to use both held and held by?
        entity.add(Carrying(f));
        f.add(CarriedBy(entity));
        entity.add(Targeting(colony));

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
        closestFood = f;
      }
    }

    if (closestFood) {
      entity.add(Targeting(closestFood))
    }
  }
}

export const DropOffFood = ({ world }: {world: World }) => {
  const colony = world.queryFirst(Position, IsColony);

  if (!colony) return;

  world.query(Position, IsAnt, Carrying("*"), Targeting(colony)).forEach(entity => {
    const target = entity.targetFor(Targeting);
    const targetPos = target?.get(Position);
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
    }
  })
}

export const SyncCarriedFoodPosition = ({ world, delta }: { world: World, delta: number }) => {
  world.query(Position, CarriedBy("*"), IsFood).updateEach(([ pos ], entity) => {
    const ant = entity.targetFor(CarriedBy);
    const antPosition = ant?.get(Position);

    if (!antPosition) return;

    // TODO: compensate for rotation of ant as well
    pos.x = antPosition.x;
    pos.y = antPosition.y + 0.5;
    pos.z = antPosition.z;
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

    // dir.desired.copy(randomDirection.direction);


    /*
    const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), randomDirection.direction);
    meshRef.ref.quaternion.slerp(quaternion, ROTATION_SPEED * delta);

    pos.x += randomDirection.direction.x * SCOUT_SPEED * delta;
    pos.z += randomDirection.direction.z * SCOUT_SPEED * delta;
    */
  })
}