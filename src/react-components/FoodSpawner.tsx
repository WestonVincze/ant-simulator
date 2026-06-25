import { useEffect, useRef } from "react";
import { Entity } from "koota";
import { useQuery } from "koota/react";
import { Group, Mesh } from "three";
import { IsFood, MeshRef, Position } from "../ecs/traits";

export function FoodSpawner() {
  const groupRef = useRef<Group>(null!);
  const entities = useQuery(IsFood, Position);

  return (
    <group ref={groupRef}>
      {entities.map((entity: Entity) => <Food entity={entity} key={entity}/>)}
    </group>
  )
}

export function Food({ entity }: { entity: Entity }) {
  const meshRef = useRef<Mesh>(null!);

  useEffect(() => {
    entity.add(MeshRef({ ref: meshRef.current }))

    return () => {
      entity.remove(MeshRef);
    };
  }, [entity]);

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <sphereGeometry args={[0.35, 18, 18]}/>
      <meshStandardMaterial color="#8d2d0a" roughness={0.25} metalness={0.8} />
    </mesh>
  )
}
