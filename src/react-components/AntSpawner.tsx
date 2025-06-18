import { useEffect, useRef, useState } from "react";
import { Entity } from "koota";
import { useQuery } from "koota/react";
import { Group, Mesh, AnimationMixer } from "three";
import { GLTFLoader } from "three-stdlib";
import { useFrame } from "@react-three/fiber";

import { IsAnt, MeshRef, Position } from "../ecs/traits";

// shared model and animations (only load once)
let sharedModel: Group | null = null;
let sharedAnimations: any[] = [];

export function AntSpawner() {
  const groupRef = useRef<Group>(null!);
  const entities = useQuery(IsAnt, Position);

  useEffect(() => { 
    if (!sharedModel) {
      const loader = new GLTFLoader();
      loader.load(
        "ant/source/ant.glb",
        (gltf) => {
          sharedModel = gltf.scene;
          sharedAnimations = gltf.animations;
        },
        undefined,
        (error) => {
          console.error("Error loading model:", error);
        }
      );
    }
  }, []);

  return (
    <group ref={groupRef}>
      {entities.map((entity: Entity) => <Ant entity={entity} key={entity}/>)}
    </group>
  )
}

export function Ant({ entity }: { entity: Entity }) {
  const meshRef = useRef<Mesh>(null!);
  const mixerRef = useRef<AnimationMixer | null>(null);
  const [isInitialized, setInitialized] = useState(false);

  useEffect(() => {
    if (sharedModel && !isInitialized) {
      // Clone the shared model for this entity
      const modelClone = sharedModel.clone();
      meshRef.current.add(modelClone);

      // Create a new mixer for this entity
      const mixer = new AnimationMixer(modelClone);
      mixerRef.current = mixer;

      if (sharedAnimations.length > 0) {
        const anim = sharedAnimations.findIndex(a => a.name === "Walk");
        const action = mixer.clipAction(sharedAnimations[anim]);
        action.play();
      }

      // Add MeshRef trait to the entity
      entity.add(MeshRef({ ref: meshRef.current }));

      setInitialized(true);
    }
    return () => {
      // Cleanup when the component unmounts
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
      }
      entity.remove(MeshRef);
    };
  }, [entity]);

  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }
  })

  return (
    <mesh ref={meshRef} castShadow receiveShadow />
  )
}