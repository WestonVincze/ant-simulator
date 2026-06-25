import { useQueryFirst } from "koota/react";
import { IsColony, Position } from "../ecs/traits";
import { ANTHILL, ENTRANCE_Y } from "../constants";

export function Colony () {
  const colony = useQueryFirst(IsColony, Position);

  if (!colony) return null;

  const pos = colony.get(Position)!;

  return (
    <group position={[pos.x, 0, pos.z]}>
      {/* Main mound */}
      <mesh castShadow receiveShadow position={[0, ANTHILL.centerY, 0]}>
        <cylinderGeometry args={[ANTHILL.topRadius, ANTHILL.baseRadius, ANTHILL.height, 20]} />
        <meshStandardMaterial color="#C8A481" roughness={0.95} metalness={0.3} />
      </mesh>
      {/* Entrance hole */}
      <mesh position={[0, ENTRANCE_Y + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[ANTHILL.entranceRadius, 24]} />
        <meshStandardMaterial color="#1a1a1a" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}
