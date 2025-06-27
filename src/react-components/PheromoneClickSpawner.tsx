import { useCallback, useEffect } from "react";
import { Plane, Raycaster, Vector2, Vector3 } from "three";
import { useThree } from "@react-three/fiber";
import { useActions } from "koota/react";
import { exampleActions } from "../ecs";

export const PheromoneClickSpawner = () => {
  const { camera, gl, size } = useThree();
  const { spawnPheromone } = useActions(exampleActions);

  const handleClick = useCallback((event: MouseEvent) => {
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
      spawnPheromone(intersection.x, 0, intersection.z);
    }
  }, [camera, size]);


  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [gl, handleClick]);

  return null;
}
