import { relation, trait } from "koota";
import { Mesh, Vector3 } from "three";

// for demo purposes we store all traits (ecs components) in a single file

export const IsAnt = trait();
export const Targeting = relation({ exclusive: true });
export const Carrying = relation({ exclusive: true });
export const CarriedBy = relation();
export const Direction = trait({ x: 0, y: 0, z: 0});

export const RandomDirection = trait({
  direction: { x: 0, y: 0, z: 0 },
  timeSinceLastUpdate: 0
})

export const Sensor = trait({
  lookingFor: "food",
  position: Vector3,
  value: 0,
  action: "forward",
  radius: 5
})

export const Position = trait({ x: 0, y: 0, z: 0 });
// we only use this mesh as an init value for types, we'll pass the actual mesh when adding this trait
export const MeshRef = trait({ref: new Mesh});

export const IsFood = trait();

export const IsColony = trait();

// separate pheromone trails for each ant
type PheromoneSchema = {
  intensity: number;
  type: "return" | "food";
}

export const Pheromone = trait<PheromoneSchema>({
  intensity: 0,
  type: "return"
});

export const PheromoneSpawner = trait({ 
  timeSinceLastSpawn: 0
})

export const Static = trait();
