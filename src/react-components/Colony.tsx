import { useEffect, useRef } from "react";
import { Mesh } from "three";
import { IsColony, MeshRef, Position } from "../ecs/traits";
import { useQueryFirst } from "koota/react";

export function Colony () {
  const colony = useQueryFirst(IsColony, Position);
  const meshRef = useRef<Mesh>(null!);

  useEffect(() => {
    colony?.add(MeshRef({ ref: meshRef.current }))

    return () => {
      colony?.remove(MeshRef);
    };
  }, [colony]);

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <coneGeometry args={[5, 5, 20]} />
      <meshStandardMaterial color={"tan"} />
    </mesh>
  )
}
