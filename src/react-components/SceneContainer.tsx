import { Html, OrbitControls, PerspectiveCamera } from "@react-three/drei";
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
import { GLTFLoader } from "three-stdlib";

const ASSETS = [
  "ant/source/ant.glb",
  "ant/textures/ant_carp_bump.png",
  "bambanani_sunset.webp",
  "bg.png"
];

export function SceneContainer() {
  const world = useWorld();
  const debugMode = false;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let loaded = 0;
    const gltfLoader = new GLTFLoader();
    const textureLoader = new TextureLoader();

    const onAssetLoaded = () => {
      loaded += 1;
      if (loaded === ASSETS.length) setLoading(false);
    };

    gltfLoader.load(ASSETS[0], () => onAssetLoaded(), undefined, onAssetLoaded);

    for (let i = 1; i < ASSETS.length; i++) {
      textureLoader.load(ASSETS[i], () => onAssetLoaded(), undefined, onAssetLoaded);
    }
  }, []);

  useFrame((_state, delta) => {
    // this is how we connect our ecs systems to r3f
    schedule.run({ world, delta });
  });

  if (loading) {
    return (
      <mesh>
        <planeGeometry args={[10, 5]} />
        <meshBasicMaterial color="#222" />
        <Html center>
          <div style={{
            color: "white",
            fontSize: "2rem",
            textAlign: "center",
            background: "rgba(0,0,0,0.7)",
            padding: "2rem",
            borderRadius: "1rem"
          }}>
            Loading assets...
          </div>
        </Html>
      </mesh>
    );
  }

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
      <directionalLight castShadow color={"#ffb65e"} intensity={3} position={[2, 6, 2.5]} />

      {texture && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
          <circleGeometry args={[500, 500]} />
          <meshStandardMaterial map={texture} />
        </mesh>
      )}
    </>
  )
}