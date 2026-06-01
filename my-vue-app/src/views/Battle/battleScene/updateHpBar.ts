  import Phaser from 'phaser';

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
      [key: string]: any;
    }

  export function updateHpBar(sprite: Phaser.GameObjects.Sprite) {
    const g = sprite.getData('hpBar') as Phaser.GameObjects.Graphics;
    if (!g || !sprite.scene) return;
    g.clear();

    const ud = sprite.getData('unitData') as UnitData;
    const maxHp = ud.health;
    const curHp = (ud.currentHealth != null) ? ud.currentHealth : maxHp;
    const frac = Phaser.Math.Clamp(curHp / maxHp, 0, 1);

    const barWidth = Phaser.Math.Clamp((sprite.displayWidth) * 0.9, 24, 120);
    const barHeight = 6;
    const bx = sprite.x - barWidth / 2;
    const by = sprite.y - sprite.displayHeight - 8;

    g.fillStyle(0x000000, 0.6);
    g.fillRoundedRect(bx - 1, by - 1, barWidth + 2, barHeight + 2, 3);
    g.fillStyle(0xaa4444, 1);
    g.fillRoundedRect(bx, by, barWidth, barHeight, 3);

    const fillW = Math.max(1, Math.floor(barWidth * frac));
    g.fillStyle(0x66cc66, 1);
    g.fillRoundedRect(bx, by, fillW, barHeight, 3);

    if (sprite.depth != null) g.setDepth(sprite.depth + 1);
  }