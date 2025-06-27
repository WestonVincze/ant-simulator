import { useQuery, useTrait } from "koota/react"
import { Direction, MeshRef, Position, Sensors } from "../ecs/traits"
import { useEffect, useRef } from "react";
import { Group, Mesh } from "three";
import { Entity } from "koota";
import { getSensorWorldPositions } from "../utils";

export const SensorGizmos = () => {
  const groupRef = useRef<Group>(null!);
  const entities = useQuery(Position, Sensors);

  return(
    <group ref={groupRef}>
      {entities.map((entity: Entity) => <SensorMesh entity={entity} key={entity} />)}
    </group>
  )
}

export const SensorMesh = ({ entity }: { entity: Entity }) => {
  const meshRef = useRef<Mesh>(null!);
  const sensors = useTrait(entity, Sensors);
  const position = useTrait(entity, Position);
  const direction = useTrait(entity, Direction);

  useEffect(() => {
    entity.add(MeshRef({ ref: meshRef.current }))

    return () => {
      entity.remove(MeshRef);
    };
  }, [entity]);

  if (!position || !direction || !sensors) return;

  const sensorPos = getSensorWorldPositions(position, direction.current, {
    front: sensors.frontOffset,
    left: sensors.leftOffset,
    right: sensors.rightOffset
  })

  return (
    <>
      <mesh ref={meshRef} position={sensorPos.front.clone()}>
        <sphereGeometry args={[sensors.radius, 18, 18]}/>
        <meshStandardMaterial color={"red"} transparent={true} opacity={0.3} />
      </mesh>
      <mesh ref={meshRef} position={sensorPos.left.clone()}>
        <sphereGeometry args={[sensors.radius, 18, 18]}/>
        <meshStandardMaterial color={"red"} transparent={true} opacity={0.3} />
      </mesh>
      <mesh ref={meshRef} position={sensorPos.right.clone()}>
        <sphereGeometry args={[sensors.radius, 18, 18]}/>
        <meshStandardMaterial color={"red"} transparent={true} opacity={0.3} />
      </mesh>
    </>
  )

}