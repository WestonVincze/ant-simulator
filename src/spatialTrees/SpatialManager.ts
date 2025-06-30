import { Entity } from "koota";
import RBush from "rbush";
import { Vector3 } from "three";

export class SpatialManager<T> {
  private map = new Map();
  private tree = new RBush<{
    entity: Entity,
    data: T,
  }>();

  addItem (
    entity: Entity,
    position: Vector3,
    data: T,
  ) {
    const item = {
      minX: position.x,
      minY: position.z,
      maxX: position.x,
      maxY: position.z,
      entity,
      data
    }
    this.map.set(entity.id(), item);
    this.tree.insert(item);
  }

  removeItem (entityId: number)  {
    this.tree.remove(this.map.get(entityId));
    this.map.delete(entityId);
  }

  query (position: Vector3, range: number) {
    return this.tree.search({
      minX: position.x - range,
      minY: position.z - range,
      maxX: position.x + range,
      maxY: position.z + range,
    });
  }
}
