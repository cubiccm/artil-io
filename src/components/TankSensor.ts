import * as types from '@/types';
import Global from '@/global';
import Tank from '@/components/Tank';

export default class TankSensor {
  parent: Tank;
  part: string;
  ignore_movable_object: boolean;
  body: MatterJS.BodyType;
  touch_count: integer = 0;
  blocked = false;

  constructor(
    body: MatterJS.BodyType,
    parent: Tank,
    part: string,
    ignore_movable_object: boolean
  ) {
    this.body = body;
    this.parent = parent;
    this.part = part;
    this.ignore_movable_object = ignore_movable_object;
    body.onCollideCallback = (pair: MatterJS.ICollisionData) => {
      if (
        ignore_movable_object &&
        !(
          (pair.bodyA as MatterJS.BodyType).isStatic ||
          (pair.bodyB as MatterJS.BodyType).isStatic
        )
      )
        return;
      this.touch_count += 1;
      this.blocked = true;
    };
    body.onCollideEndCallback = (pair: MatterJS.ICollisionData) => {
      if (
        ignore_movable_object &&
        !(
          (pair.bodyA as MatterJS.BodyType).isStatic ||
          (pair.bodyB as MatterJS.BodyType).isStatic
        )
      )
        return;
      this.touch_count -= 1;
      this.blocked = this.touch_count > 0;
    };
  }
}
