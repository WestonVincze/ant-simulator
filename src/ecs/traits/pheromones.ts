import { trait } from "koota";

type PheromoneSchema = {
  intensity: number;
  type: "home" | "food";
  stepsFromGoal: number;
};

export const Pheromone = trait<PheromoneSchema>({
  intensity: 1,
  type: "home",
  stepsFromGoal: 0,
});

export const PheromoneSpawner = trait({ 
  type: "home",
  timeSinceLastSpawn: 0,
  stepCount: 0,
});
