import { useEffect, useState } from "react";
import { Plane, Raycaster, Vector2, Vector3 } from "three";
import { useThree } from "@react-three/fiber";
import { useActions } from "koota/react";
import { simulationActions } from "../ecs";

export const ClickSpawner = () => {
  const { camera, gl, size } = useThree();
  const { spawnFood } = useActions(simulationActions);

  const [isSpawning, setIsSpawning] = useState(false);

  const handleClick = (event: MouseEvent) => {
    if (!isSpawning) return;
    // Convert mouse position to NDC (-1 to 1)
    const mouse = new Vector2(
      (event.clientX / size.width) * 2 - 1,
      -(event.clientY / size.height) * 2 + 1
    );

    // Raycast from camera through the mouse
    const raycaster = new Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Intersect with plane at y = 0
    const groundPlane = new Plane(new Vector3(0, 1, 0), 0);
    const intersection = new Vector3();

    if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
      spawnFood(intersection.x, 0.5, intersection.z)
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "f") {
      setIsSpawning((prev) => !prev);
    } 
   }

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      canvas.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    }
  }, [gl, handleClick, handleKeyDown]);

  return null;
}
