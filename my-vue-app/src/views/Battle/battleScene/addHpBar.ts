import Phaser from 'phaser';
import {
updateHpBar
} from "@/views/Battle/Import";
  export function addHpBar(sprite: Phaser.GameObjects.Sprite,scene:Phaser.Scene): Phaser.GameObjects.Graphics {
    const bar = scene.add.graphics();
    sprite.setData('hpBar', bar);
    updateHpBar(sprite);
    sprite.on('destroy', () => {
      if (bar && !(bar as any).destroyed) bar.destroy();
    });
    return bar;
  }
