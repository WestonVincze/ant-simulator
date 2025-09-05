import { useEffect, useRef, useState } from "react";
import { Entity } from "koota";
import { useQuery } from "koota/react";
import { Group, Mesh, AnimationMixer, AnimationAction, MeshStandardMaterial, TextureLoader } from "three";
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

          // Load the bump texture
          const textureLoader = new TextureLoader();
          const bumpTexture = textureLoader.load("ant/textures/ant_carp_bump.png");

          // Assign a lustrous black material to all meshes in the model
          sharedModel.traverse((child: any) => {
            if (child.isMesh) {
              // Eyes
              if (child.name === "Hercules_Ant051" || child.name === "Hercules_Ant064") {
                child.material = new MeshStandardMaterial({
                  color: 0x080808,
                  metalness: 0.9,
                  roughness: 0.1,
                  envMapIntensity: 1.5
                });
              } else {
                child.material = new MeshStandardMaterial({
                  color: 0x2a1c0a,
                  metalness: 0.5,
                  roughness: 0.3,
                  envMapIntensity: 1.0,
                  bumpMap: bumpTexture,
                  bumpScale: 0.4
                });
                child.material.needsUpdate = true;
              }
            }
          });
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