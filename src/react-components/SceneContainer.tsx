import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useWorld } from "koota/react";
import { EquirectangularReflectionMapping, SRGBColorSpace, Texture, TextureLoader } from "three";
import { useEffect, useState } from "react";
import { AntSpawner } from "./AntSpawner";
import { schedule } from "../ecs";
import { FoodSpawner } from "./FoodSpawner";
import { Colony } from "./Colony";
import { Pheromones } from "./Pheromones";
import { ClickSpawner } from "./ClickSpawner";
import { SensorGizmos } from "./SensorGizmos";

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
  const { scene } = useThree();
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    const loader = new TextureLoader;
    loader.load(
      "bambanani_sunset.webp",
      (texture) => {
        texture.mapping = EquirectangularReflectionMapping;
        texture.colorSpace = SRGBColorSpace;
        scene.environment = texture;
        scene.background = texture;
      },
      undefined,
      (error) => {
        console.error("Error loading texture file:", error);
      }
    );
    loader.load("bg.png", (loadedTexture) => {
      setTexture(loadedTexture);
    })
  }, [scene]);

  return (
    <>
      {/*<color attach="background" args={['#606033']} />*/}
      <directionalLight castShadow color={"#ffb65e"} intensity={3} position={[2, 6, 2.5]} />

      {texture && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
          <planeGeometry args={[500, 500]} />
          <meshStandardMaterial map={texture} />
        </mesh>
      )}

      {/*
      <Environment frames={1} environmentIntensity={0.4}>
        <Sky sunPosition={[0, 1, 11]}/>
      </Environment>
      */}
    </>
  )
}