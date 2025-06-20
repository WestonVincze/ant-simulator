
import { useEffect, useRef } from "react";
import { Entity } from "koota";
import { useQuery } from "koota/react";
import { Group, Mesh } from "three";
import { MeshRef, Pheromone, Position } from "../ecs/traits";

export function Pheromones() {
  const groupRef = useRef<Group>(null!);
  const entities = useQuery(Pheromone, Position);

  return (
    <group ref={groupRef}>
      {entities.map((entity: Entity) => <PheromoneMesh entity={entity} key={entity}/>)}
    </group>
  )
}

export function PheromoneMesh({ entity }: { entity: Entity }) {
  const meshRef = useRef<Mesh>(null!);
  const color = entity.get(Pheromone)?.type === "food" ? "red" : "blue";

  useEffect(() => {
    entity.add(MeshRef({ ref: meshRef.current }))

    return () => {
      entity.remove(MeshRef);
    };
  }, [entity]);

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.25]} />
      <meshStandardMaterial color={color} transparent={true} />
    </mesh>
  )
}
