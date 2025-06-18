import { Canvas } from "@react-three/fiber";
import { useActions, useQuery } from "koota/react";

import { SceneContainer } from "./SceneContainer";
import { exampleActions } from "../ecs";
import { IsAnt, Position } from "../ecs/traits";

export default function App() {
  const entities = useQuery(IsAnt, Position);
  const { spawnAnt, removeAnt, spawnFood, removeFood } = useActions(exampleActions);

  return (
    <div className={"Container text-white"} id={"app"}>
      <Canvas shadows>
        <SceneContainer/>
      </Canvas>

      <div className="absolute bottom-5 left-5 flex gap-5">
        <div onClick={spawnAnt} className={"btn btn-green"}>
          Spawn Ant!
        </div>

        <div onClick={removeAnt} className={"btn btn-red"}>
          Remove Ant!
        </div>

        <div onClick={spawnFood} className={"btn btn-purple"}>
          Spawn Food!
        </div>

        <div onClick={removeFood} className={"btn btn-red"}>
          Remove Food!
        </div>
      </div>

      <div className={"absolute bottom-20 left-5"} style={{fontSize: "2.5rem"}}>
        Number of Ants: {entities.length}
      </div>

    </div>
  )
}


