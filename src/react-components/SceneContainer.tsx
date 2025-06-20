import { Environment, Grid, OrbitControls, PerspectiveCamera, Sky } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useWorld } from "koota/react";
import { AntSpawner } from "./AntSpawner";
import { schedule } from "../ecs";
import { FoodSpawner } from "./FoodSpawner";
import { Colony } from "./Colony";
import { useEffect } from "react";
import { IsColony, Position } from "../ecs/traits";
import { Pheromones } from "./Pheromones";

export function SceneContainer() {
  const world = useWorld();

  useEffect(() => {
    world.spawn(IsColony, Position({ x: 0, y: 2.5, z: 0 }));
  }, [])

  useFrame((_state, delta) => {
    // this is how we connect our ecs systems to r3f
    schedule.run({ world, delta });
  });

  return (
    <>
      <Colony />
      <Pheromones />
      <AntSpawner />
      <FoodSpawner />
      <Background />
      <OrbitControls dampingFactor={1} />
      <PerspectiveCamera makeDefault position={[40, 20, 20]} />
    </>
  )
}

const Background = () => {
  return (
    <>
      <color attach="background" args={['#060612']} />
      <directionalLight castShadow color={"#ffb65e"} intensity={3} position={[4, 3, 1]} />

      <Grid
        infiniteGrid
        fadeDistance={500}
        fadeStrength={5}
        cellSize={6} sectionSize={3}
        sectionColor={'#3d4367'}
        cellColor={'rgb(15,28,145)'}
      />

      <Environment frames={1} environmentIntensity={0.4}>
        <Sky sunPosition={[0, 1, 11]}/>
      </Environment>
    </>
  )
}