import { changeHp, showDamage } from "@/views/Battle/Import";

export class Effect {
  private icon?: Phaser.GameObjects.Image;
  private colorTween?: Phaser.Tweens.Tween;

  constructor(
    public target: Phaser.GameObjects.Sprite,
    public ability: any,
    public scene: Phaser.Scene
  ) {}

  apply() {
    if (this.ability.type === 'dot') {
      this.applyDot();
    }
  }

  applyDot() {
    const { duration, damage_per_tick, apply_chance } = this.ability;
    const totalTicks = duration;
    let ticksDone = 0;

    //иконка
    this.icon = this.scene.add.image(this.target.x, this.target.y + 2, this.ability.icon_path);
    this.icon.setDisplaySize(30, 30)
    this.icon.setOrigin(0.5, 0.5);
    this.icon.setDepth(10);
    //иконка движеться за целью
    const updateIconPosition = () => {
      if (this.icon && this.target.active) {
        this.icon.x = this.target.x;
        this.icon.y = this.target.y + 2;
      }
    };
    //таймер для обновления положения
    const followTimer = this.scene.time.addEvent({
      delay: 16,
      loop: true,
      callback: updateIconPosition,
    });
    const interval = this.scene.time.addEvent({
      delay: 400,
      repeat: totalTicks - 1,
      callback: () => {
        if (Math.random() <= this.ability.apply_chance) {
          const unitData = this.target.getData('unitData');
          if (unitData) {
            this.flashUnitColor();
            unitData.currentHealth -= this.ability.damage_per_tick;
            this.target.setData('unitData', unitData);
            changeHp(this.target);
            showDamage(this.target.x, this.target.y, this.ability.damage_per_tick, this.scene);
            if (unitData.currentHealth <= 0) {
              this.target.destroy();
            }
          }
        }
        ticksDone++;
        if (ticksDone >= totalTicks) {
          followTimer.remove();
          if (this.icon) {
            this.icon.destroy();
            this.icon = undefined;
          }
        }
      },
    });
  }

  //метод для смены цвета юнита
  private flashUnitColor() {
    const originalTint = this.target.tintTopLeft;
    this.target.setTint(parseInt(this.ability.color.split('#')[1],16));
    if (this.colorTween) {
      this.colorTween.stop();
    }
    this.colorTween = this.scene.tweens.add({
      targets: this.target,
      tintTopLeft: originalTint,
      duration: 300,
      onComplete: () => {
        this.target.clearTint();
      }
    });
  }
}