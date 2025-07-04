import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, Mesh, PlaneGeometry, ShaderMaterial, Vector3 } from "three";
import { useQuery } from "koota/react";
import { Pheromone, Position } from "../ecs/traits";

const MAX_POINTS = 1000;

class HeatmapMaterial extends ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        points: { value: [] },
        pointCount: { value: 0 },
        maxDistance: { value: 1.0 },
        intensity: { value: 0.3 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 points[${MAX_POINTS}];
        uniform int pointCount;
        uniform float maxDistance;
        uniform float intensity;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          float totalHeat = 0.0;
          
          for(int i = 0; i < ${MAX_POINTS}; i++) {
            if(i >= pointCount) break;
            
            vec3 point = points[i];
            float distance = length(vPosition.xz - point.xz);
            
            if(distance < maxDistance) {
              // Smooth falloff using smoothstep
              float falloff = 1.0 - smoothstep(0.0, maxDistance, distance);
              // Square the falloff for more concentrated heat
              falloff = falloff * falloff;
              totalHeat += falloff * intensity;
            }
          }
          
          // Clamp totalHeat to prevent oversaturation
          totalHeat = min(totalHeat, 0.5);
          
          // Red color with alpha based on heat intensity
          vec3 color = vec3(1.0, 0.0, 0.0);
          float alpha = totalHeat;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: AdditiveBlending
    })
  }
}

export const HeatmapShader = () => {
  const meshRef = useRef<Mesh>(null!);
  const heatmapMaterialRef = useRef<ShaderMaterial | null>();
  const { scene } = useThree();
  const [points, setPoints] = useState<{ x: number; y: number; z: number }[]>([]);

  const pheromones = useQuery(Pheromone);

  useEffect(() => {
    const updatedPoints = pheromones.map((entity) => {
      const pos = entity.get(Position)!;
      return { x: pos.x, y: pos.y, z: pos.z }
    })

    setPoints(updatedPoints)
  })

  useEffect(() => {
    const geometry = new PlaneGeometry(100, 100, 128, 128);
    geometry.rotateX(-Math.PI / 2);
    const material = new HeatmapMaterial();
    const heatmapPlane = new Mesh(geometry, material);
    scene.add(heatmapPlane);

    heatmapMaterialRef.current = material;
  }, [])

  const updateShaderPoints = (newPoints: Vector3[]) => {
    if (!heatmapMaterialRef.current) return;

    const pointsArray = new Array(MAX_POINTS).fill(null).map(() => new Vector3(0, 0, 0));
    newPoints.forEach((point, index) => {
      if (index < MAX_POINTS) {
        pointsArray[index].set(point.x, point.y, point.z || 0);
      }
    });

    heatmapMaterialRef.current.uniforms.points.value = pointsArray;
    heatmapMaterialRef.current.uniforms.pointCount.value = Math.min(newPoints.length, MAX_POINTS);
    heatmapMaterialRef.current.uniforms.maxDistance.value = 2.0;
    heatmapMaterialRef.current.uniforms.intensity.value = 0.6;
  };

  useFrame(() => {
    const newPoints = points.map(p => new Vector3(p.x, p.y, p.z));
    updateShaderPoints(newPoints);
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 1, 0]}>
    </mesh>
  );
};
