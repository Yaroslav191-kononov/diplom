  import Phaser from 'phaser';
  export function showDamage(x: number, y: number, damage: number,scene:Phaser.Scene) {
    const dmgText = scene.add.text(x, y - 30, '-' + damage, { fontSize: '20px', color: '#ff0000' });
    scene.tweens.add({
      targets: dmgText,
      y: (dmgText as Phaser.GameObjects.Text).y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => dmgText.destroy()
    });
  }  