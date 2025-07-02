import { Environment, Grid, OrbitControls, PerspectiveCamera, Sky } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useWorld } from "koota/react";
import { AntSpawner } from "./AntSpawner";
import { schedule } from "../ecs";
import { FoodSpawner } from "./FoodSpawner";
import { Colony } from "./Colony";
import { Pheromones } from "./Pheromones";
import { ClickSpawner } from "./ClickSpawner";
import { SensorGizmos } from "./SensorGizmos";
import { Texture, TextureLoader } from "three";
import { useEffect, useState } from "react";

export function SceneContainer() {
  const world = useWorld();
  const debugMode = false;

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
      <ClickSpawner />
      {debugMode && <SensorGizmos />}
    </>
  )
}

const Background = () => {
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    const loader = new TextureLoader();
    loader.load("bg.png", (loadedTexture) => {
      setTexture(loadedTexture);
    })

  }, []);

  return (
    <>
      <color attach="background" args={['#226033']} />
      <directionalLight castShadow color={"#ffb65e"} intensity={3} position={[4, 3, 1]} />

      {texture && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
          <planeGeometry args={[500, 500]} />
          <meshStandardMaterial map={texture} />
        </mesh>
      )}

      <Environment frames={1} environmentIntensity={0.4}>
        <Sky sunPosition={[0, 1, 11]}/>
      </Environment>
    </>
  )
}