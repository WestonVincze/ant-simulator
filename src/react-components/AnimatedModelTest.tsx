import { useEffect, useRef, useState } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { AnimationAction, AnimationMixer, Group } from "three";
import { useFrame } from "@react-three/fiber";

/**
 * Testing GLB model with single animation - manual frame slice to capture "walk"
 */
export function AnimatedModelTest() {
  const modelRef = useRef<Group>();
  const [mixer, setMixer] = useState<AnimationMixer | null>(null);
  const [action, setAction] = useState<AnimationAction | null>(null);

  const fps = 24;
  const sectionStart = 0;
  const sectionEnd = 39 / fps;

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      "walking-ant/source/cartoon_ant.glb",
      (gltf) => {
        modelRef.current = gltf.scene;
        const newMixer = new AnimationMixer(gltf.scene);
        const clip = gltf.animations.find(a => a.name === "Take 001" || a.name === "take1");
        if (clip) {
          const animAction = newMixer.clipAction(clip);
          animAction.time = sectionStart;
          animAction.play();
          setAction(animAction);
        }
        setMixer(newMixer);
      },
      undefined,
      (error) => {
        console.error("Error loading GLB model:", error);
      }
    );
  }, []);

  useFrame((_state, delta) => {
    if (mixer && action) {
      mixer.update(delta);
      // Clamp the animation time to the section
      if (action.time > sectionEnd) {
        action.time = sectionStart;
      }
    }
  });

  return (
    modelRef.current && <primitive object={modelRef.current} />
  );
}
