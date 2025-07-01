import { relation, trait } from "koota";
import { Mesh, Vector3, InstancedMesh } from "three";

// for demo purposes we store all traits (ecs components) in a single file

export const IsAnt = trait();
export const Targeting = relation({ exclusive: true });
export const Carrying = relation({ exclusive: true });
export const CarriedBy = relation();

export const Move = trait({
  maxSpeed: 4,
  currentSpeed: 4,
})

export const Direction = trait({
  desired: () => new Vector3,
  current: () => new Vector3,
});

export const RandomDirection = trait({
  direction: () => new Vector3,
  timeSinceLastUpdate: 0
})

export const Sensors = trait({
  frontOffset: () => new Vector3,
  leftOffset: () => new Vector3,
  rightOffset:() => new Vector3,
  lookingFor: "food",
  // position: () => new Vector3,
  value: 0,
  radius: 1
})

// each ant has 3 sensors

export const Position = trait(() => new Vector3);
// we only use this mesh as an init value for types, we'll pass the actual mesh when adding this trait
export const MeshRef = trait({ref: new Mesh});

export const IsFood = trait();

export const IsColony = trait();

type PheromoneSchema = {
  intensity: number;
  type: "home" | "food";
  stepsFromGoal: number;
  // stepCount? (we could track the number of steps or some measurement of distance/value for the pheromone node)
}

export const Pheromone = trait<PheromoneSchema>({
  intensity: 1,
  type: "home",
  stepsFromGoal: 0,
});

export const PheromoneSpawner = trait({ 
  type: "home",
  timeSinceLastSpawn: 0,
  stepCount: 0,
})

export const Static = trait();

export const FoodPheromoneMeshRef = trait<{ ref: InstancedMesh | null }>({ ref: null })
export const HomePheromoneMeshRef = trait<{ ref: InstancedMesh | null }>({ ref: null })
