import { Canvas } from "@react-three/fiber";
import { useActions, useQuery } from "koota/react";

import { SceneContainer } from "./SceneContainer";
import { exampleActions } from "../ecs";
import { IsAnt, IsFood, Position } from "../ecs/traits";

export default function App() {
  const ants = useQuery(IsAnt, Position);
  const food = useQuery(IsFood, Position);
  const { spawnAnt, removeAnt, spawnFood, removeFood } = useActions(exampleActions);

  return (
    <div className={"Container text-white"} id={"app"}>
      <Canvas shadows>
        <SceneContainer/>
      </Canvas>

      <div className="absolute bottom-5 left-5 flex flex-col gap-2">
        
        <div className="flex gap-8">
          <div className="text-xl">
            Ants: <b>{ants.length}</b>
          </div>
          <div className="text-xl">
            Food: <b>{food.length}</b>
          </div>
        </div>

        <div className="flex gap-5 max-w-full flex-wrap">
          <div onClick={spawnAnt} className={"btn btn-green"}>
            + Ant
          </div>

          <div onClick={removeAnt} className={"btn btn-red"}>
            - Ant
          </div>

          <div onClick={spawnFood} className={"btn btn-purple"}>
            + Food
          </div>

          <div onClick={removeFood} className={"btn btn-red"}>
            - Food
          </div>
        </div>
      </div>
    </div>
  )
}


