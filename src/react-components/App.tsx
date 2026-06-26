import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useActions, useQuery, useWorld } from "koota/react";

import { SceneContainer } from "./SceneContainer";
import { MenuScreen } from "./MenuScreen";
import { simulationActions } from "../ecs";
import { InColony, IsAnt, IsFood, Pheromone, Position } from "../ecs/traits";
import { Not } from "koota";
import { settings } from "../settings";
import { clearFoodManager } from "../ecs/systems/food";
import { resetSpawnTimer } from "../ecs/systems/movement";

export default function App() {
  const world = useWorld();
  const [screen, setScreen] = useState<"menu" | "simulation">("menu");
  const ants = useQuery(IsAnt, Position);
  const food = useQuery(IsFood, Position, Not(InColony));
  const foragedFood = useQuery(IsFood, InColony);
  const { spawnAnt, spawnFood } = useActions(simulationActions);
  const menuAntCount = useRef(0);
  const menuIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (screen === "menu") {
      menuAntCount.current = 0;

      menuIntervalRef.current = setInterval(() => {
        if (menuAntCount.current < 50) {
          spawnAnt(1);
          menuAntCount.current++;
        }
      }, 2000);
    }

    return () => {
      if (menuIntervalRef.current) {
        clearInterval(menuIntervalRef.current);
        menuIntervalRef.current = null;
      }
    };
  }, [screen]);

  const handleStart = () => {
    settings.simulationActive = true;

    if (menuIntervalRef.current) {
      clearInterval(menuIntervalRef.current);
      menuIntervalRef.current = null;
    }

    world.query(IsAnt).forEach(e => e.destroy());
    world.query(IsFood).forEach(e => e.destroy());
    world.query(Pheromone).forEach(e => e.destroy());
    clearFoodManager();
    resetSpawnTimer();

    spawnAnt(settings.startingAnts);

    let remaining = settings.foodCount;
    while (remaining > 0) {
      const clusterSize = Math.min(remaining, 10 + Math.floor(Math.random() * 6));
      spawnFood(clusterSize);
      remaining -= clusterSize;
    }

    setScreen("simulation");
  };

  return (
    <div className={"Container text-white"} id={"app"}>
      <Canvas shadows>
        <SceneContainer/>
      </Canvas>

      {screen === "menu" && <MenuScreen onStart={handleStart} />}

      {screen === "simulation" && (
        <div className="absolute bottom-5 left-5 flex flex-col gap-2">
          
          <div className="flex flex-col gap-2 mb-2">
            <div className="text-xl">
              Ants: <b>{ants.length}</b>
            </div>
            <div className="text-xl">
              Available Food: <b>{food.length}</b>
            </div>
            <div className="text-xl">
              Foraged Food: <b>{foragedFood.length}</b>
            </div>
          </div>

          <div className="flex gap-5 max-w-full flex-wrap">
            <div onClick={() => spawnAnt()} className={"btn btn-primary"}>
              +10 Ants
            </div>

            <div onClick={() => spawnFood()} className={"btn btn-primary"}>
              +10 Food
            </div>

            <div onClick={() => handleStart()} className={"btn btn-primary"}>
              Restart
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
