import { useRef, useEffect } from 'react';
import { InstancedMesh, DynamicDrawUsage } from 'three';
import { useWorld } from 'koota/react';
import { FoodPheromoneMeshRef, HomePheromoneMeshRef } from '../ecs/traits';

export function Pheromones() {
  return (
    <>
      <PheromoneInstances type="food" color="red" />
      <PheromoneInstances type="home" color="blue" />
    </>
  );
}

function PheromoneInstances({ type, color }: { type: string; color: string }) {
  const world = useWorld();
  const meshRef = useRef<InstancedMesh>(null!);

  useEffect(() => {
    meshRef.current.instanceMatrix.setUsage(DynamicDrawUsage);
    if (type === "home") {
      world.add(HomePheromoneMeshRef({ ref: meshRef.current }));
    } else if (type === "food") {
      world.add(FoodPheromoneMeshRef({ ref: meshRef.current }));
    }

    return () => {
      world.remove(HomePheromoneMeshRef);
      world.remove(FoodPheromoneMeshRef);
    }
  }, []);

  return (
    <instancedMesh
      ref={meshRef}
      /* TODO: dynamically create a new instancedMesh once max count is reached */
      args={[undefined, undefined, 100000]}
    >
      <dodecahedronGeometry args={[0.2]} />
      <meshStandardMaterial color={color} /*transparent opacity={0.5}*/ />
    </instancedMesh>
  );
}