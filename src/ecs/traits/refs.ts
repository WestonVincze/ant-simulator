import { trait } from "koota";
import { InstancedMesh, Mesh } from "three";

// we only use this mesh as an init value for types, we'll pass the actual mesh when adding this trait
export const MeshRef = trait({ref: new Mesh});



export const FoodPheromoneMeshRef = trait<{ ref: InstancedMesh | null }>({ ref: null });
export const HomePheromoneMeshRef = trait<{ ref: InstancedMesh | null }>({ ref: null });
