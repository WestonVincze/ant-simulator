import { Canvas } from "@react-three/fiber";
import { useActions, useQuery } from "koota/react";

import { SceneContainer } from "./SceneContainer";
import { exampleActions } from "../ecs";
import { IsAnt, Position } from "../ecs/traits";


export default function App() {
  const entities = useQuery(IsAnt, Position);
  const {spawnAnt: spawnSphere, removeAnt: removeSphere} = useActions(exampleActions);

  return (
    <div className={"Container text-white"} id={"app"}>
      <Canvas shadows>
        <SceneContainer/>
      </Canvas>

      <div onClick={spawnSphere} className={"absolute btn btn-blue bottom-5 left-5"}>
        Spawn Ant!
      </div>

      <div onClick={removeSphere} className={"absolute btn btn-red bottom-5 left-60"}>
        Remove Ant!
      </div>

      <div className={"absolute bottom-20 left-5"} style={{fontSize: "2.5rem"}}>
        Number of Ants: {entities.length}
      </div>

    </div>
  )
}


