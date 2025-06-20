
import { useEffect, useRef, useState } from "react";
import { Entity } from "koota";
import { useQuery, useTrait } from "koota/react";
import { Group, Mesh, Vector3 } from "three";
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
  const pheromone = useTrait(entity, Pheromone)
  const position = useTrait(entity, Position)

  useEffect(() => {
    entity.add(MeshRef({ ref: meshRef.current }))

    return () => {
      entity.remove(MeshRef);
    };
  }, [entity]);

  return (
    <mesh ref={meshRef} position={new Vector3(position?.x, position?.y,position?.z)}>
      <dodecahedronGeometry args={[0.15]} />
      <meshStandardMaterial color={pheromone?.type === "food" ? "red" : "blue"} /*transparent={true} */ />
    </mesh>
  )
}
