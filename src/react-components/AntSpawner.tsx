import { useEffect, useRef, useState } from "react";
import { Entity } from "koota";
import { useQuery } from "koota/react";
import { Group, Mesh, AnimationMixer, AnimationAction } from "three";
import { GLTFLoader } from "three-stdlib";

import { AnimationRef, IsAnt, MeshRef, Position } from "../ecs/traits";

// shared model and animations (only load once)
let sharedModel: Group | null = null;
let sharedAnimations: any[] = [];
let walkAnimation: any = null;

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
          walkAnimation = sharedAnimations.find(a => a.name === "Walk");
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
  // const mixerRef = useRef<AnimationMixer | null>(null);
  const [isInitialized, setInitialized] = useState(false);

  useEffect(() => {
    if (sharedModel && !isInitialized) {
      // Clone the shared model for this entity
      const modelClone = sharedModel.clone();
      meshRef.current.add(modelClone);

      // Create a new mixer for this entity
      const mixer = new AnimationMixer(modelClone);
      let action: AnimationAction | null = null;

      if (walkAnimation) {
        action = mixer.clipAction(walkAnimation);
        action.play();
      }

      // Add MeshRef trait to the entity
      entity.add(AnimationRef({ mixer, action }))
      entity.add(MeshRef({ ref: meshRef.current }));

      setInitialized(true);
    }
    return () => {
      // Cleanup when the component unmounts
      entity.remove(AnimationRef);
      entity.remove(MeshRef);
    };
  }, [entity]);

  return (
    <mesh ref={meshRef} castShadow receiveShadow />
  )
}