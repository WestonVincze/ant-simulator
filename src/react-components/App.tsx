import { Canvas } from "@react-three/fiber";
import { useActions, useQuery } from "koota/react";

import { SceneContainer } from "./SceneContainer";
import { exampleActions } from "../ecs";
import { InColony, IsAnt, IsFood, Position } from "../ecs/traits";
import { Not } from "koota";

export default function App() {
  const ants = useQuery(IsAnt, Position);
  const food = useQuery(IsFood, Position, Not(InColony));
  const foragedFood = useQuery(IsFood, InColony);
  const { spawnAnt, spawnFood } = useActions(exampleActions);

  return (
    <div className={"Container text-white"} id={"app"}>
      <Canvas shadows>
        <SceneContainer/>
      </Canvas>

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
          <div onClick={() => spawnAnt()} className={"btn btn-green"}>
            +10 Ants
          </div>

          <div onClick={() => spawnFood()} className={"btn btn-purple"}>
            +10 Food
          </div>
        </div>
      </div>
    </div>
  )
}
