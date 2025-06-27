import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, DynamicDrawUsage } from 'three';
import { useQuery } from 'koota/react';
import { Pheromone, Position } from '../ecs/traits';

export function Pheromones() {
  return (
    <>
      <PheromoneInstances type="food" color="red" />
      <PheromoneInstances type="home" color="blue" />
    </>
  );
}

function PheromoneInstances({ type, color }: { type: string; color: string }) {
  const meshRef = useRef<InstancedMesh>(null!);
  const dummy = new Object3D();

  const allPheromones = useQuery(Pheromone, Position);
  const entities = allPheromones.filter(e => e.get(Pheromone)?.type === type);

  useEffect(() => {
    meshRef.current.instanceMatrix.setUsage(DynamicDrawUsage);
  }, []);

  useFrame(() => {
    entities.forEach((entity, i) => {
      const pos = entity.get(Position);
      if (!pos) return;

      dummy.position.set(pos.x, 0, pos.z);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.count = entities.length;
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, entities.length]}
    >
      <dodecahedronGeometry args={[0.1]} />
      <meshStandardMaterial color={color} /*transparent opacity={0.5}*/ />
    </instancedMesh>
  );
}