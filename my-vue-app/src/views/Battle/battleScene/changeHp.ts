  import Phaser from 'phaser';
import {
updateHpBar
} from "@/views/Battle/Import";
    interface UnitData {
      health: number;
      image_url: string;
      count: number;
      currentHealth: number;
      isRange: boolean;
      range: number;
      power: number;
      meleeSpeed: number;
      attackCooldown: number;
      // allow additional fields
      [key: string]: any;
    }
    
  export function changeHp(sprite: Phaser.GameObjects.Sprite) {
    const ud = sprite.getData('unitData') as UnitData;
    updateHpBar(sprite);
    if (ud.currentHealth <= 0 && sprite.active) sprite.destroy();
  }