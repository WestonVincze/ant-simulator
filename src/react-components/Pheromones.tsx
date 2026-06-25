import { useRef, useEffect, useMemo } from 'react';
import { Points, DynamicDrawUsage, ShaderMaterial, BufferGeometry, BufferAttribute, AdditiveBlending, Color } from 'three';
import { useWorld } from 'koota/react';
import { FoodPheromoneMeshRef, HomePheromoneMeshRef } from '../ecs/traits';

const vertexShader = `
  uniform float uMaxSize;
  uniform float uScale;
  attribute float aIntensity;
  varying float vIntensity;

  void main() {
    float vis = mix(0.15, 1.0, aIntensity);
    vIntensity = vis;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uMaxSize * vis * (uScale / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vIntensity;

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha *= vIntensity * uOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const MAX_PHEROMONES = 1000000;

export function Pheromones() {
  return (
    <>
      <PheromonePoints type="food" color="#ff0000" />
      <PheromonePoints type="home" color="#0044ff" />
    </>
  );
}

function PheromonePoints({ type, color }: { type: string; color: string }) {
  const world = useWorld();
  const pointsRef = useRef<Points>(null!);

  const geometry = useMemo(() => {
    const geom = new BufferGeometry();
    const positions = new Float32Array(MAX_PHEROMONES * 3);
    const intensities = new Float32Array(MAX_PHEROMONES);
    geom.setAttribute('position', new BufferAttribute(positions, 3).setUsage(DynamicDrawUsage));
    geom.setAttribute('aIntensity', new BufferAttribute(intensities, 1).setUsage(DynamicDrawUsage));
    geom.setDrawRange(0, 0);
    return geom;
  }, []);

  const material = useMemo(() => new ShaderMaterial({
    uniforms: {
      uMaxSize: { value: 1.5 },
      uScale: { value: 300.0 },
      uColor: { value: new Color(color) },
      uOpacity: { value: 0.9 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  }), [color]);

  useEffect(() => {
    if (type === 'home') {
      world.add(HomePheromoneMeshRef({ ref: pointsRef.current }));
    } else {
      world.add(FoodPheromoneMeshRef({ ref: pointsRef.current }));
    }

    return () => {
      world.remove(HomePheromoneMeshRef);
      world.remove(FoodPheromoneMeshRef);
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
  );
}
