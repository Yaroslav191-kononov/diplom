import Phaser from 'phaser';
import {
  updateHpBar,changeHp,addHpBar,showDamage,Effect,showHealingEffect
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
  id?: string; 
  side?: string;
  [key: string]: any;
}

export class ReplayScene extends Phaser.Scene {
  public attackerUnits: Phaser.GameObjects.Sprite[] = [];
  public defenderUnits: Phaser.GameObjects.Sprite[] = [];
  public unitsData: { [id: string]: UnitData } = {};
  public battleField?: Phaser.GameObjects.Image;
  public attackerUnitsData: UnitData[] = [];
  public defenderUnitsData: UnitData[] = [];
  public attackerGroup!: Phaser.GameObjects.Group;
  public defenderGroup!: Phaser.GameObjects.Group;

  constructor() {
    super({ key: 'ReplayScene' });
  }

  init(data: { unitsData: { attackerUnits: UnitData[]; defenderUnits: UnitData[] } }) {
    const dataUnit = data.unitsData;

    this.attackerUnitsData = (dataUnit.attackerUnits || []).map((u: UnitData) => ({
      ...u,
      currentHealth: u.health ?? u.health,
    }));

    this.defenderUnitsData = (dataUnit.defenderUnits || []).map((u: UnitData) => ({
      ...u,
      currentHealth: u.health ?? u.health,
    }));

    const w = this.scale.width;
    const h = this.scale.height;

    this.battleField = this.add.image(w / 2, h / 2, 'bgBattle');
    this.battleField.setDisplaySize(w, h);
    this.battleField.setOrigin(0.5, 0.5);
    this.battleField.setDepth(0);

    // группы
    this.attackerGroup = this.physics.add.group();
    this.defenderGroup = this.physics.add.group();

    this.attackerUnits = [];
    this.defenderUnits = [];
    
    const attackerStartX = w * 0.25;
    const defenderStartX = w * 0.75;
    const startY = h * 0.3;
    let index=0;

    const spawnUnitCluster = (
      group: Phaser.GameObjects.Group,
      unitsDataArray: UnitData[],
      startX: number,
      startY: number,
      isAttacker: boolean
    ) => {
      const spacingX = 20;
      const spacingY = 18;
      const layerSpacing = 50;
      const rangeOffset = 24;

      for (let i = 0; i < unitsDataArray.length; i++) {
        const unitData = unitsDataArray[i];
        const unitCount = unitData.count;
        if (!unitCount || unitCount <= 0) continue;

        const cols = Math.ceil(Math.sqrt(unitCount));
        const rows = Math.ceil(unitCount / cols);
        const baseY = startY + i * layerSpacing;

        for (let j = 0; j < unitCount; j++) {
          const col = j % cols;
          const row = Math.floor(j / cols);
          const xOffset = (col - (cols - 1) / 2) * spacingX;
          const yOffsetGrid = (row - (rows - 1) / 2) * spacingY;
          const rangeShift = isAttacker ? rangeOffset : -rangeOffset;
          const meleeShift = isAttacker ? -rangeOffset : rangeOffset;
          const typeDepthShift = unitData.isRange ? rangeShift : meleeShift;

          const spriteX = startX + xOffset;
          const spriteY = baseY + yOffsetGrid + typeDepthShift;

          const sprite = group.create(spriteX, spriteY, unitData.image_url) as Phaser.GameObjects.Sprite;
          sprite.setData('unitData', { ...unitData, currentHealth: unitData.health,unit_index:index++ });
          sprite.setData('lastAttackTime', 0);
          sprite.setData('lastPosition', { x: sprite.x, y: sprite.y });
          sprite.setData('lastMoveTime', Date.now());
          sprite.setInteractive();
          sprite.setOrigin(0.5, 1);
          sprite.setDepth(sprite.y);
          (sprite as any).setCollideWorldBounds(true);
          (this.physics.add.existing(sprite) as any)?.body.setSize(5, 5);
          if(unitData[0]?.type=="Здание"){
            sprite.setDisplaySize(300, 300);
            sprite.y=screen.availHeight/2;
          }
          // hp bar
          addHpBar(sprite,this);
          if (isAttacker) this.attackerUnits.push(sprite);
          else this.defenderUnits.push(sprite);
        }
      }
    };
    
    spawnUnitCluster(this.attackerGroup, this.attackerUnitsData, attackerStartX, startY, true);
    index=0;
    spawnUnitCluster(this.defenderGroup, this.defenderUnitsData, defenderStartX, startY, false);
  }

  create() {
    // Пока вроде не нужен
  }

  public handleMessage(data: any) {
  switch (data.type) {
    case 'damage':
      this.applyDamage({ side: data.side, targetId: data.targetId, damage: data.damage });
      break;
    case 'unitDestroyed':
      this.destroyUnit({ side: data.side, unitId: data.unitId });
      break;
    case 'moveUnit':
      this.performMove({ side: data.side, unitId: data.unitId, x: data.x, y:data.y });
      break;
    case 'healingLush':
      this.handleHealingLush(data.position);
      break;
    case 'healingUnit':
      this.healUnit({unitId: data.unitId,heal:data.heal,side:data.side});
      break;
    case 'meteorFall':
      this.handleMeteorFall(data.position);
      break;
    case 'effect':
      this.effectUnit({side:data.side, unitId: data.unitId, ability:data.ability });
      break;      
    case 'endBattle':
      this.endBattle({side:data.side});
      break;  
  }
}


  // Поиск юнита по id
  findUnitById(id: string | number,side: string): Phaser.GameObjects.Sprite | null {
    return (
      side === 'attacker'?
        [...this.attackerUnits].find(
          (u) => u.getData('unitData')?.unit_index === id
        ) ?? null
      :
        [...this.defenderUnits].find(
          (u) => u.getData('unitData')?.unit_index === id
        ) ?? null

    );
  }
  endBattle(params: { side?: string }) {

    this.attackerUnits.forEach(unit => unit.destroy());
    this.defenderUnits.forEach(unit => unit.destroy());

    this.attackerUnits = [];
    this.defenderUnits = [];

    this.scene.pause();
    (window as any).__overData = params.side;
  }
  // Перемещение юнита
    performMove(params: { side: string, unitId: string | number; x: number; y: number }) {
      const unit = this.findUnitById(params.unitId, params.side);
      if (unit) {
        const startX = unit.x;
        const startY = unit.y;
        const targetX = params.x;
        const targetY = params.y;
        const duration = 1000;
        const startTime = Date.now();
      
        const move = () => {
          const elapsed = Date.now() - startTime;
          const t = Math.min(elapsed / duration, 1);
          const newX = startX + (targetX - startX) * t;
          const newY = startY + (targetY - startY) * t;
          unit.setPosition(newX, newY);
        
          // Обновляем lastPosition и lastMoveTime
          unit.setData('lastPosition', { x: newX, y: newY });
          unit.setData('lastMoveTime', Date.now());
        
          if (t < 1) {
            requestAnimationFrame(move);
          }
        };
      
        move();
      }
    }

  // Нанесение урона
  applyDamage(params: { side: string,targetId: string | number; damage: number }) {
    const target = this.findUnitById(params.targetId,params.side);
    if (target) {
      const data: UnitData = target.getData('unitData');
      data.currentHealth -= params.damage;
      target.setData('unitData', data);
      changeHp(target as Phaser.GameObjects.Sprite);
      showDamage((target as any)!.x, (target as any)!.y, params.damage,this);
    }
  }

  // Добавление эффекта
  effectUnit(params: { side: string, unitId: string | number; ability: any;}) {
    const unit = this.findUnitById(params.unitId, params.side);
    if (unit) {
        const effect = new Effect(unit, params.ability, this);
        effect.apply();
      }
    }

  // Удаление юнита
  destroyUnit(params: { side: string,unitId: string | number }) {
    const unit = this.findUnitById(params.unitId,params.side);
    if (unit) {
      unit!.destroy();
      params.side === 'attacker' ?
        this.attackerUnits = this.attackerUnits.filter(u => u.getData("unitData")?.unit_index !== params.unitId)
      :
        this.defenderUnits = this.defenderUnits.filter(u => u.getData("unitData")?.unit_index !== params.unitId)
      ;
    }
  }
    // Восстановления здоровья юнита по его id
  healUnit(params:{unitId: string | number, heal: number, side: string}) {
    const unit = this.findUnitById(params.unitId, params.side);
    if (unit) {
      const data: UnitData = unit.getData('unitData');
      data.currentHealth += params.heal;
      if (data.currentHealth > data.maxHealth) {
        data.currentHealth = data.maxHealth;
      }
      unit.setData('unitData', data);
      changeHp(unit as Phaser.GameObjects.Sprite);
      showHealingEffect(unit.x, unit.y, params.heal, this);
    }
  }
    // Создание исцеляюшей лужи
    handleHealingLush(arr: { x: number; y: number }) {
      [arr].forEach(point => {
        this.createHealingPuddle(point.x, point.y, 100, 10, 3000);
      });
    }
    createHealingPuddle(x: number, y: number, radius: number, healingAmount: number, duration: number) {
      const circle = new Phaser.Geom.Circle(x, y, radius);
  
      const puddleGraphics = this.add.graphics({ fillStyle: { color: 0x00ffff, alpha: 0.5 } });
      puddleGraphics.fillCircle(x, y, radius);
  
      const updatePuddleVisual = () => {
        puddleGraphics.clear();
        puddleGraphics.fillStyle(0x00ffff, 0.3);
        puddleGraphics.fillCircle(x, y, radius);
      };
  
      const updateEvent = this.time.addEvent({
        delay: 100,
        callback: () => {
          updatePuddleVisual();
        },
        loop: true
      });
  
  
      this.time.delayedCall(duration, () => {
        updateEvent.remove(false);
        puddleGraphics.destroy();
      });
    }
handleMeteorFall(arr: { x: number; y: number }) {

  [arr].forEach(point => {
    
    const meteorX = point.x;
    const startY = point.y - 300;
    const targetY = point.y;

    const fallDuration = 1000;
    const maxRadius = 100;

    const expansionCircle = this.add.graphics({ fillStyle: { color: 0xffffff, alpha: 0.3 } });
    expansionCircle.fillCircle(meteorX, targetY, 1);

    const startTime = this.time.now;
    const radiusIncrementPerMs = (maxRadius - 1) / fallDuration;

    const meteor = this.physics.add.sprite(meteorX, startY, 'meteorTexture');
    meteor.setVelocity(0, 300);
    meteor.setData('damage', 50);

    this.time.delayedCall(fallDuration, () => {
      if (meteor.active) {
        meteor.destroy();
      }
    });

    const expandEvent = this.time.addEvent({
      delay: 16,
      callback: () => {
        const elapsed = this.time.now - startTime;
        if (elapsed < fallDuration) {
          const currentRadius = 1 + radiusIncrementPerMs * elapsed;

          const t = elapsed / fallDuration;
          const startColor = { r: 255, g: 255, b: 255 };
          const endColor = { r: 255, g: 0, b: 0 };

          const currentColor = {
            r: Math.round(startColor.r + (endColor.r - startColor.r) * t),
            g: Math.round(startColor.g + (endColor.g - startColor.g) * t),
            b: Math.round(startColor.b + (endColor.b - startColor.b) * t),
          };

          const colorHex = Phaser.Display.Color.RGBToString(currentColor.r, currentColor.g, currentColor.b, 0).replace('#', '0x');

          expansionCircle.clear();
          expansionCircle.fillStyle(parseInt(colorHex), 0.3);
          expansionCircle.fillCircle(meteorX, targetY, currentRadius);
        } else {
          expansionCircle.destroy();
          expandEvent.remove();
        }
      },
      loop: true
    });
  });
}
update(time: number, delta: number) {
  const currentTime = Date.now();

  // Проверяем атакующих
  this.attackerUnits = this.attackerUnits.filter(unit => {
    const lastMoveTime = unit.getData('lastMoveTime') || 0;
    const lastPosition = unit.getData('lastPosition') || { x: unit.x, y: unit.y };
    const dx = unit.x - lastPosition.x;
    const dy = unit.y - lastPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (currentTime - lastMoveTime > 300 && distance < 0.5) {
      // Если не двигался более 0.4 сек - уничтожаем
      unit.destroy();
      return false;
    }
    return true;
  });

  // Аналогично для защитников
  this.defenderUnits = this.defenderUnits.filter(unit => {
    const lastMoveTime = unit.getData('lastMoveTime') || 0;
    const lastPosition = unit.getData('lastPosition') || { x: unit.x, y: unit.y };
    const dx = unit.x - lastPosition.x;
    const dy = unit.y - lastPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (currentTime - lastMoveTime > 400 && distance < 1) {
      unit.destroy();
      return false;
    }
    return true;
  });

  // Обновление HP баров
  this.defenderUnits.forEach(async defender => { updateHpBar(defender); });
  this.attackerUnits.forEach(async attacker => { updateHpBar(attacker); });
}
}