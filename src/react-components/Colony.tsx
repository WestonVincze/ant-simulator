import { useQueryFirst } from "koota/react";
import { IsColony, Position } from "../ecs/traits";

export function Colony () {
  const colony = useQueryFirst(IsColony, Position);

  if (!colony) return null;

  const pos = colony.get(Position)!;

  return (
    <group position={[pos.x, 0, pos.z]}>
      {/* Main mound */}
      <mesh castShadow receiveShadow position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.8, 5, 3, 20]} />
        <meshStandardMaterial color="#C8A481" roughness={0.95} metalness={0.3} />
      </mesh>
      {/* Entrance hole */}
      <mesh position={[0, 3.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.6, 24]} />
        <meshStandardMaterial color="#1a1a1a" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}
