import Phaser from 'phaser';

export function showHealingEffect(x: number, y: number, healingAmount: number, scene: Phaser.Scene) {
  const healText = scene.add.text(x, y - 30, '+' + healingAmount, { fontSize: '20px', color: '#00ff00' });
  scene.tweens.add({
    targets: healText,
    y: (healText as Phaser.GameObjects.Text).y - 50,
    alpha: 0,
    duration: 800,
    ease: 'Cubic.easeOut',
    onComplete: () => healText.destroy()
  });
}