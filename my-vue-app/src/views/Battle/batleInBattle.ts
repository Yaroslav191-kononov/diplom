import Phaser from 'phaser';
import {
  updateHpBar,changeHp,addHpBar,showDamage,Effect,showHealingEffect,updateTaskCurrent
} from "@/views/Battle/Import";
import {
  socket
} from "@/views/Battle/Socket";
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
(window as any).gameEvents = (window as any).gameEvents || {};
function sendGameEvent(eventType: string, payload: any) {
  if(localStorage.getItem("isTwo")=="true"){
    if ((socket as any)) {
      socket.send(JSON.stringify({
        type:eventType,
        data: payload,
        id:localStorage.getItem("auth"),
        timestamp: Date.now()
      }));
    }
  }
}
export class BattleScene extends Phaser.Scene {
  // данные юнитов
  attackerUnitsData: UnitData[] = [];
  defenderUnitsData: UnitData[] = [];

  // группы и сущности
  attackerGroup!: Phaser.GameObjects.Group;
  defenderGroup!: Phaser.GameObjects.Group;
  battleField?: Phaser.GameObjects.Image;
  attackerUnits: Phaser.GameObjects.Sprite[] = [];
  defenderUnits: Phaser.GameObjects.Sprite[] = [];

  // состояние боя
  battleActive = false;
  attackCooldown = 1000;
  projectileSpeed = 280;
  projectileTTL = 4000;

  // для удаления способностей после окончания боя
  meteorGraphics: Phaser.GameObjects.Graphics[] = [];
  meteorSprites: Phaser.GameObjects.Sprite[] = [];
  healingPuddles: Phaser.GameObjects.Graphics[] = [];

  constructor() {
    super({ key: 'BattleScene' });
  }

  init() {
    const data = (window as any).__battleData || { attackerUnits: [], defenderUnits: [] };
    this.attackerUnitsData = (data.attackerUnits || []).map((u: UnitData,index:number) => ({
      ...u,
      currentHealth: u.health?u.health:u[0].health,
      image_url: u.image_url?u.image_url:u[0].image_url,
      count: u.count ?? 1,
      unit_index:index
    }));

    this.defenderUnitsData = (data.defenderUnits || []).map((u: UnitData,index:number) => ({
      ...u,
      currentHealth: u.health?u.health:u[0].health,
      image_url: u.image_url?u.image_url:u[0].image_url,
      count: u.count ?? 1,
      unit_index:index
    }));

  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.battleField = this.add.image(w / 2, h / 2, 'bgBattle');
    this.battleField.setDisplaySize(this.scale.width, this.scale.height);
    this.battleField.setOrigin(0.5, 0.5);
    this.battleField.setDepth(0);

    // группы
    this.attackerGroup = this.physics.add.group();
    this.defenderGroup = this.physics.add.group();

    const attackerStartX = w * 0.25;
    const defenderStartX = w * 0.75;
    const startY = h * 0.3;

    this.attackerUnits = [];
    this.defenderUnits = [];


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
          const correctHealth = unitData.health ? unitData.health : (unitData[0]?.health ?? 100);
          sprite.setData('unitData', { ...unitData, currentHealth:correctHealth,unit_index:index++ });
          sprite.setData('lastAttackTime', 0);
          sprite.setInteractive();
          sprite.setOrigin(0.5, 1);
          (sprite as any).setCollideWorldBounds(true);
          (this.physics.add.existing(sprite) as any)?.body.setSize(5, 5);
          if(unitData[0]?.type=="Здание"){
            sprite.setData('unitData', { ...unitData[0],...unitData, currentHealth:1000,unit_index:index++ });
            sprite.setDisplaySize(300, 300);
            sprite.y=screen.availHeight/2;
            sprite.setDepth(10);
          }
          else{
            sprite.setDepth(100);
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

    this.physics.add.collider(this.attackerGroup, this.attackerGroup, (this as any).handleAllyCollision, undefined, this);
    this.physics.add.collider(this.defenderGroup, this.defenderGroup, (this as any).handleAllyCollision, undefined, this);

    this.battleActive = true;
    this.attackCooldown = 1000;
    this.projectileSpeed = 280;
    this.projectileTTL = 4000;
  }

  update(time: number, delta: number) {

    if (!this.battleActive) return;

    // Обработка событий метеорита и лужи
    if ((window as any).gameEvents.triggerMeteorFall) {
      if((window as any).gameEvents.triggerMeteorFall.id==localStorage.getItem("auth") || localStorage.getItem("isTwo")=="true"){
        (this as any).handleMeteorFall((window as any).gameEvents.triggerMeteorFall.arr);
        (window as any).gameEvents.triggerMeteorFall = null;
      }
    }
    if ((window as any).gameEvents.triggerHealingLush) {
      if((window as any).gameEvents.triggerHealingLush.id==localStorage.getItem("auth") || localStorage.getItem("isTwo")=="true"){
        this.handleHealingLush((window as any).gameEvents.triggerHealingLush.arr);
        (window as any).gameEvents.triggerHealingLush = null;
      }
    }

    this.defenderUnits.forEach(async defender => {updateHpBar(defender);});
    this.attackerUnits.forEach(async attacker => {updateHpBar(attacker);});
    const dt = delta / 1000;

    const unitTargetInfo = new Map<Phaser.GameObjects.Sprite, { target: Phaser.GameObjects.Sprite | null, lastTargetChangeTime: number }>();
    const unitTargetDefender = new Map<Phaser.GameObjects.Sprite, { target: Phaser.GameObjects.Sprite | null, lastTargetChangeTime: number }>();
    this.attackerUnits.forEach(attacker => {
      if (!unitTargetInfo.has(attacker)) {
        unitTargetInfo.set(attacker, { target: null, lastTargetChangeTime: 0 });
      }
    });
    this.defenderUnits.forEach(defender => {
      if (!unitTargetDefender.has(defender)) {
        unitTargetDefender.set(defender, { target: null, lastTargetChangeTime: 0 });
      }
    });
    // атакующие
    this.attackerUnits.forEach(async (attacker,index) => {
      updateHpBar(attacker);
      if (!attacker.active) return;

      const currentTime = time;

      const attackerUnitData = attacker.getData('unitData') as UnitData;
      if (!unitTargetInfo.get(attacker)?.target || (currentTime - (unitTargetInfo.get(attacker)?.lastTargetChangeTime ?? 0)) >= 5) {
      if (attackerUnitData[0]?.type === 'Здание') {
          const lastAttack = attacker.getData('lastAttackTime') ?? 0;
          if (time - lastAttack >= this.attackCooldown) {
            this.spawnBuildingUnits(attackerUnitData.units[0],this.attackerUnits);
            attacker.setData('lastAttackTime', time);
            return;
          }
          else{
            return;
          }
      }
      const isRange = attackerUnitData.isRange;
      const range = attackerUnitData.range ?? 120;
      const power = attackerUnitData.power ?? 10;

      // найти ближайшую цель
      let nearestTarget: Phaser.GameObjects.Sprite | null = null;
      let minDist = Infinity;
      this.defenderUnits.forEach(defender => {
        if (!defender.active) return;
        const dx = defender.x - attacker.x;
        const dy = defender.y - attacker.y;
        const dist = Math.hypot(dx, dy);
        if (dist < minDist) {
          minDist = dist;
          nearestTarget = defender;
        }
      });

      if (!nearestTarget) return;
      unitTargetInfo.set(attacker, { target: nearestTarget, lastTargetChangeTime: currentTime });
      await sendGameEvent('moveUnit', {
        side: 'attacker',
        unitId: attacker.getData('unitData').unit_index,
        x: (nearestTarget as any).x,
        y: (nearestTarget as any).y
      });
      const dx = (nearestTarget as any).x - attacker.x;
      const dy = (nearestTarget as any).y - attacker.y;
      const dist = Math.hypot(dx, dy);

      if (isRange) {
        if (dist <= range) {
          const lastAttack = attacker.getData('lastAttackTime') ?? 0;
          if (time - lastAttack >= this.attackCooldown) {
            const projectile = this.physics.add.sprite(attacker.x, attacker.y, 'evil');
            projectile.setDisplaySize(10, 10);
            (projectile.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
            projectile.setData('damage', power);
            projectile.setData('ownerSide', 'attacker');
            const angle = Phaser.Math.Angle.Between(attacker.x, attacker.y, (nearestTarget as any)!.x, (nearestTarget as any)!.y);
            this.physics.velocityFromRotation(angle, this.projectileSpeed, (projectile.body as Phaser.Physics.Arcade.Body).velocity);

            this.time.delayedCall(this.projectileTTL, () => {
              if (projectile && projectile.active) projectile.destroy();
            });

            this.physics.add.overlap(
              projectile,
              nearestTarget,
              async (proj: Phaser.GameObjects.GameObject, target: Phaser.GameObjects.GameObject) => {
                if (!proj.active || !target.active) return;
                ((proj as Phaser.GameObjects.Sprite) as any).disableBody(true, true);

                const damage = (proj as any).getData('damage') || 0;
                const targetUnitData = (target as any).getData('unitData') || {};
                targetUnitData.currentHealth = (targetUnitData.currentHealth ?? targetUnitData.health ?? 0) - damage;
                (target as Phaser.GameObjects.Sprite).setData('unitData', targetUnitData);
                sendGameEvent('damage', {
                  side: 'defender',
                  targetId: target.getData('unitData').unit_index,
                  damage: damage,
                  attackerId: attacker.getData('unitData').unit_index
                });
                changeHp(target as Phaser.GameObjects.Sprite);
                showDamage((target as any)!.x, (target as any)!.y, damage,this);
                if (targetUnitData.currentHealth <= 0) {
                  if(target.getData('unitData')){
                    sendGameEvent('unitDestroyed', {
                      side: 'defender',
                      unitId: target.getData('unitData').unit_index,
                  item:4
                    });
                  }
                  target!.destroy();
                  this.defenderUnits = this.defenderUnits.filter(u => u !== target);
                }
                else {
                  if (attackerUnitData.abilities && attackerUnitData.abilities.length > 0) {
                    for (const ability of attackerUnitData.abilities) {
                      const effect = new Effect(nearestTarget!, ability, this);
                      effect.apply();
                      sendGameEvent('effect', {
                        side: 'defender',
                        targetId: (nearestTarget as any).getData('unitData').unit_index,
                        ability: ability,
                      });
                    }
                  }
                }
              },
              null,
              this
            );
            attacker.setData('lastAttackTime', time);
          }
        }
      } else {
        if (dist > 12) {
          const body = attacker.body as Phaser.Physics.Arcade.Body;
          const vx = dx / dist;
          const vy = dy / dist;
          if (body) {
            body.setVelocity(vx, vy);
          }
          attacker.x += vx * attackerUnitData.meleeSpeed! * dt;
          attacker.y += vy * attackerUnitData.meleeSpeed! * dt;
          updateHpBar(attacker);
          attacker.setDepth(attacker.y);
        } else {
          const lastAttack = attacker.getData('lastAttackTime') ?? 0;
          if (time - lastAttack >= this.attackCooldown) {
            if((nearestTarget as any) && (nearestTarget as any).getData('unitData') && attacker.getData('unitData')){
              sendGameEvent('damage', {
                side: 'defender',
                targetId: (nearestTarget as any).getData('unitData').unit_index,
                damage: power,
                attackerId: attacker.getData('unitData').unit_index
              });
            }
            const unitData = (nearestTarget as any)!.getData('unitData') || {};
            unitData.currentHealth = (unitData.currentHealth ?? unitData.health ?? 0) - power;
            if((nearestTarget as any)!.getData('unitData')){
              changeHp(nearestTarget!);
              showDamage((nearestTarget as any)!.x, (nearestTarget as any)!.y, power,this);
            }
            if (unitData.currentHealth <= 0) {
              if((nearestTarget as any).getData('unitData')){
               sendGameEvent('unitDestroyed', {
                side: 'defender',
                 unitId: (nearestTarget as any).getData('unitData').unit_index,
                  item:3
               });
              }
              (nearestTarget as any)!.destroy();
              this.defenderUnits = this.defenderUnits.filter(u => u !== nearestTarget);
            }
            else {
              if (attackerUnitData.abilities && attackerUnitData.abilities.length > 0) {
                for (const ability of attackerUnitData.abilities) {
                  const effect = new Effect(nearestTarget, ability, this);
                  sendGameEvent('effect', {
                    side: 'defender',
                    targetId: (nearestTarget as any).getData('unitData').unit_index,
                    ability: ability,
                  });
                  effect.apply();
                }
              }
            }
            attacker.setData('lastAttackTime', time);
          }
        }
      }
    }
  });

    // защитники
    this.defenderUnits.forEach(async defender => {
      if (!defender.active) return;

      const currentTime = time;

      const defenderUnitData = defender.getData('unitData') as UnitData;
      if (!unitTargetDefender.get(defender)?.target || (currentTime - (unitTargetDefender.get(defender)?.lastTargetChangeTime ?? 0)) >= 5) {
      if (defenderUnitData[0]?.type === 'Здание') {
        // если юнит - здание, вызываем spawn
        const lastAttack = defender.getData('lastAttackTime') ?? 0;
        if (time - lastAttack >= 2500) {
          this.spawnBuildingUnits(defenderUnitData.units[0],this.defenderUnits);
          defender.setData('lastAttackTime', time);
        }
        return; 
      }

      const isRange = defenderUnitData.isRange;
      const range = defenderUnitData.range ?? 120;
      const power = defenderUnitData.power ?? 10;

      let nearestTarget: Phaser.GameObjects.Sprite | null = null;
      let minDist = Infinity;

      this.attackerUnits.forEach( async attacker => {
        if (!attacker.active) return;
        const dx = attacker.x - defender.x;
        const dy = attacker.y - defender.y;
        const dist = Math.hypot(dx, dy);
        if (dist < minDist) {
          minDist = dist;
          nearestTarget = attacker;
        }
      });

      if (!nearestTarget) return;
      unitTargetDefender.set(defender, { target: nearestTarget, lastTargetChangeTime: currentTime });
      await sendGameEvent('moveUnit', {
        side: 'defender',
        unitId: defender.getData('unitData').unit_index,
        x: (nearestTarget as any).x,
        y: (nearestTarget as any).y
      });
      const dx = (nearestTarget as any).x - defender.x;
      const dy = (nearestTarget as any).y - defender.y;
      const dist = Math.hypot(dx, dy);

      if (isRange) {
        if (dist <= range) {
          const lastAttack = defender.getData('lastAttackTime') ?? 0;
          if (time - lastAttack >= this.attackCooldown) {
            const projectile = this.physics.add.sprite(defender.x, defender.y, 'evil'); // используем ту же текстуру
            projectile.setDisplaySize(10, 10);
            (projectile.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
            projectile.setData('damage', power);
            projectile.setData('ownerSide', 'defender');
            const angle = Phaser.Math.Angle.Between(defender.x, defender.y, (nearestTarget as any)!.x, (nearestTarget as any)!.y);
            this.physics.velocityFromRotation(angle, this.projectileSpeed, (projectile.body as Phaser.Physics.Arcade.Body).velocity);

            this.time.delayedCall(this.projectileTTL, () => {
              if (projectile && projectile.active) projectile.destroy();
            });

            this.physics.add.overlap(
              projectile,
              nearestTarget,
              async (proj: Phaser.GameObjects.GameObject, target: Phaser.GameObjects.GameObject ) => {
                if (!proj.active || !target.active) return;
                ((proj as Phaser.GameObjects.Sprite) as any).disableBody(true, true);

                const damage = (proj as any).getData('damage') || 0;
                const targetUnitData = (target as any).getData('unitData') || {};
                targetUnitData.currentHealth = (targetUnitData.currentHealth ?? targetUnitData.health ?? 0) - damage;
                (target as Phaser.GameObjects.Sprite).setData('unitData', targetUnitData);
                if(target.getData('unitData') && defender.getData('unitData')){
                  sendGameEvent('damage', {
                    side: 'attacker',
                    targetId: target.getData('unitData').unit_index,
                    damage: damage,
                    attackerId: defender.getData('unitData').unit_index
                  });
                }
                changeHp(target as Phaser.GameObjects.Sprite);
                showDamage((target as any)!.x, (target as any)!.y, damage,this);
                if (targetUnitData.currentHealth <= 0) {
                  if(target.getData('unitData')){
                    sendGameEvent('unitDestroyed', {
                      side:'attacker',
                      unitId: target.getData('unitData').unit_index,
                      item:2
                    });
                  }
                  target!.destroy();
                  this.attackerUnits = this.attackerUnits.filter(u => u !== target);
                }
                else {
                  if (defenderUnitData.abilities && defenderUnitData.abilities.length > 0) {
                    for (const ability of defenderUnitData.abilities) {
                      const effect = new Effect(nearestTarget!, ability, this);
                      sendGameEvent('effect', {
                        side: 'attacker',
                        targetId: (nearestTarget as any).getData('unitData').unit_index,
                        ability: ability,
                      });                      
                      effect.apply();
                    }
                  }
                }
              },
              null,
              this
            );

            defender.setData('lastAttackTime', time);
          }
        }
      } else {
        if (dist > 12) {
          const body = defender.body as Phaser.Physics.Arcade.Body;
          const vx = dx / dist;
          const vy = dy / dist;
          if (body) {
            body.setVelocity(vx, vy);
          }
          defender.x += vx * defenderUnitData.meleeSpeed! * dt;
          defender.y += vy * defenderUnitData.meleeSpeed! * dt;

          updateHpBar(defender);
          defender.setDepth(defender.y);
        } else {
          const lastAttack = defender.getData('lastAttackTime') ?? 0;
          if (time - lastAttack >= this.attackCooldown) {
            const unitData = (nearestTarget! as any).getData('unitData') || {};
            unitData.currentHealth = (unitData.currentHealth ?? unitData.health ?? 0) - power;


            if((nearestTarget as any).getData('unitData')){
              sendGameEvent('damage', {
                side: 'attacker',
                targetId: (nearestTarget as any)!.getData('unitData').unit_index,
                damage: power,
                attackerId: (nearestTarget as any)!.getData('unitData').unit_index
              });
            }
            if (unitData.currentHealth <= 0) {
              if((nearestTarget as any).getData('unitData')){
                sendGameEvent('unitDestroyed', {
                  side: 'attacker',
                  unitId: (nearestTarget as any).getData('unitData').unit_index,
                  item:1
                });
                changeHp(nearestTarget!);
              }
            showDamage((nearestTarget as any)!.x, (nearestTarget as any)!.y, power,this);
            (nearestTarget as any)!.destroy();
            this.attackerUnits = this.attackerUnits.filter(u => u !== nearestTarget);
            }
            else {
              if (defenderUnitData.abilities && defenderUnitData.abilities.length > 0) {
                for (const ability of defenderUnitData.abilities) {
                  const effect = new Effect(nearestTarget!, ability, this);
                  sendGameEvent('effect', {
                    side: 'attacker',
                    targetId: (nearestTarget as any).getData('unitData').unit_index,
                    ability: ability,
                  });
                  effect.apply();
                }
              }
            }
            defender.setData('lastAttackTime', time);
          }
        }
      }
    }
    });

    // конец боя
    const aliveAttackers = this.attackerUnits.filter(u => u.active && (u.getData('unitData')?.currentHealth ?? 0) > 0);
    const aliveDefenders = this.defenderUnits.filter(u => u.active && (u.getData('unitData')?.currentHealth ?? 0) > 0);

    if (aliveAttackers.length === 0 || aliveDefenders.length === 0) {
      this.battleActive = false;
      const winner = aliveAttackers.length > 0 ? 'Нападающие' : 'Защитники';
      console.log('Бой завершён. Победитель: ' + winner);
      (window as any).__overData = winner;
      sendGameEvent('endBattle', {
        side: winner,
      });

      (window as any).__Defender = getTotalCount(aliveDefenders);
      (window as any).__Attacker = getTotalCount(aliveAttackers);
      
      this.attackerUnits.forEach(unit => unit.destroy());
      this.attackerUnits = [];

      this.defenderUnits.forEach(unit => unit.destroy());
      this.defenderUnits = [];

      this.meteorGraphics.forEach(circle => circle.destroy());
      this.meteorGraphics = [];

      this.meteorSprites.forEach(sprite => sprite.destroy());
      this.meteorSprites = [];

      this.healingPuddles.forEach(puddle => puddle.destroy());
      this.healingPuddles = [];
    }
    function getTotalCount(arr:Phaser.GameObjects.Sprite[]){
      const uniqueObjects = [];
      const seenIds = new Set();

      for (const item of arr) {
        if (!seenIds.has(item.getData('unitData').id)) {
          seenIds.add(item.getData('unitData').id);
          uniqueObjects.push(item.getData('unitData'));
        }
      }
      return uniqueObjects;
    }
  }
spawnBuildingUnits(buildingUnits: any[], UnitsArr: any[]) {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Координаты для спавна
    const spawnPoints = [
      { x: centerX - 30, y: centerY },
      { x: centerX + 30, y: centerY },
      { x: centerX, y: centerY - 30 },
      { x: centerX - 15, y: centerY - 15 },
      { x: centerX + 15, y: centerY + 15 }

    ];
    const selectedSpawnPoints: {x:number,y:number}[] = [];
    for (let i = 0; i < Math.min(2, buildingUnits.length); i++) {
      let randomIndex: number;
      let spawnPoint: {x:number,y:number};

      do {
        randomIndex = Math.floor(Math.random() * spawnPoints.length);
        spawnPoint = spawnPoints[randomIndex];
      } while (selectedSpawnPoints.includes(spawnPoint))
        
      selectedSpawnPoints.push(spawnPoint);
      const elem = buildingUnits[i];
      const unitSprite = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, elem.image_url);
      unitSprite.setOrigin(0.5, 1);
      unitSprite.setDepth(100);
      unitSprite.setData('unitData', { ...elem, currentHealth: elem.health });
      addHpBar(unitSprite,this);
      UnitsArr.push(unitSprite);
    }
    return;
  }
  handleAllyCollision(unit1: Phaser.GameObjects.Sprite, unit2: Phaser.GameObjects.Sprite) {
  const body1 = unit1.body as Phaser.Physics.Arcade.Body;
  const body2 = unit2.body as Phaser.Physics.Arcade.Body;

  const overlapX = unit1.x - unit2.x;
  const overlapY = unit1.y - unit2.y;

  const pushStrength = 50;

  if (overlapX !== 0) {
    body1.velocity.x += (overlapX > 0 ? pushStrength : -pushStrength);
    body2.velocity.x += (overlapX > 0 ? -pushStrength : pushStrength);
  }
  if (overlapY !== 0) {
    body1.velocity.y += (overlapY > 0 ? pushStrength : -pushStrength);
    body2.velocity.y += (overlapY > 0 ? -pushStrength : pushStrength);
  }
}
handleMeteorFall(arr: { x: number; y: number }[]) {
  const role = localStorage.getItem("role");

  arr.forEach(point => {
      sendGameEvent('meteorFall', { position: { x: point.x, y: point.y } });
    const meteorX = point.x;
    const startY = point.y - 300;
    const targetY = point.y;

    const fallDuration = 1000;
    const maxRadius = 100;

    const expansionCircle = this.add.graphics({ fillStyle: { color: 0xffffff, alpha: 0.3 } });
    expansionCircle.fillCircle(meteorX, targetY, 1);
    this.meteorGraphics.push(expansionCircle);

    const startTime = this.time.now;
    const radiusIncrementPerMs = (maxRadius - 1) / fallDuration;

    const meteor = this.physics.add.sprite(meteorX, startY, 'meteorTexture');
    meteor.setVelocity(0, 300);
    meteor.setData('damage', 50);
    this.meteorSprites.push(meteor);

    this.time.delayedCall(fallDuration, () => {
      if (meteor.active) {
        meteor.destroy();
        this.applyMeteorDamage(meteorX, targetY, maxRadius, role);
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
  // Метод нанесения урона метеоритом
  applyMeteorDamage(
    x: number,
    y: number,
    radius: number,
    role: string | null
  ) {
    const damageAmount = 50;
    if (role === 'attacker') {
      // Наносим урон защитным юнитам
      this.defenderUnits.forEach(unit => {
        if (!unit.active) return;
        const data = unit.getData('unitData');
        const dx = unit.x - x;
        const dy = unit.y - y;
        if (Math.hypot(dx, dy) <= radius) {
          data.currentHealth -= damageAmount;
          unit.setData('unitData', data);
          sendGameEvent('damage', {
            side: 'defender',
            targetId: unit.getData('unitData').unit_index,
            damage: damageAmount,
            attackerId: unit.getData('unitData').unit_index
          });
          changeHp(unit);
          showDamage(unit.x, unit.y, damageAmount,this);
          if (data.currentHealth <= 0) {
            if(unit.getData('unitData')){
              sendGameEvent('unitDestroyed', {
                side: 'defender',
                unitId:  unit.getData('unitData').unit_index
              });
            }
            unit.destroy();
            this.defenderUnits = this.defenderUnits.filter(u => u !== unit);
          }
        }
      });
    } else if (role === 'defender') {
      // Наносим урон атакующим юнитам
      this.attackerUnits.forEach(unit => {
        if (!unit.active) return;
        const data = unit.getData('unitData');
        const dx = unit.x - x;
        const dy = unit.y - y;
        if (Math.hypot(dx, dy) <= radius) {
          data.currentHealth -= damageAmount;
          unit.setData('unitData', data);
          changeHp(unit);
          sendGameEvent('damage', {
            side: 'attacker',
            targetId: unit.getData('unitData').unit_index,
            damage: damageAmount,
            attackerId: unit.getData('unitData').unit_index
          });
          showDamage(unit.x, unit.y, damageAmount,this);
          if (data.currentHealth <= 0) {
            if(unit.getData('unitData')){
              sendGameEvent('unitDestroyed', {
                side: 'attacker',
                unitId:  unit.getData('unitData').unit_index
              });
            }
            unit.destroy();
            this.attackerUnits = this.attackerUnits.filter(u => u !== unit);
          }
        }
      });
    }
  }
  // Метод для создания исцеляющей лужи
  handleHealingLush(arr: { x: number; y: number }[]) {
    arr.forEach(point => {
      this.createHealingPuddle(point.x, point.y, 100, 10, 3000);
      sendGameEvent('healingLush', { position: { x: point.x, y: point.y } });
    });
  }
  createHealingPuddle(x: number, y: number, radius: number, healingAmount: number, duration: number) {
    const circle = new Phaser.Geom.Circle(x, y, radius);

    const puddleGraphics = this.add.graphics({ fillStyle: { color: 0x00ffff, alpha: 0.5 } });
    puddleGraphics.fillCircle(x, y, radius);
    this.healingPuddles.push(puddleGraphics);

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

    const healingEvent = this.time.addEvent({
      delay: 500,
      callback: () => {
          const role = localStorage.getItem("role");
          if(role === 'attacker'){
            [...this.attackerUnits].forEach(unit => {
              if (!unit.active) return;
              const dx = unit.x - x;
              const dy = unit.y - y;
              if (Phaser.Geom.Circle.Contains(circle, unit.x, unit.y)) {
                // Восстанавливаем здоровье
                const data = unit.getData('unitData');
                data.currentHealth += healingAmount;
                if (data.currentHealth > data.maxHealth) {
                  data.currentHealth = data.maxHealth;
                }
                unit.setData('unitData', data);
                sendGameEvent('healingUnit', {
                  side: 'attacker',
                  unitId: unit.getData('unitData').unit_index,
                  heal: healingAmount,
                 });
                changeHp(unit);
                showHealingEffect(unit.x, unit.y, healingAmount, this);
              }
            });
          }
          else if(role === 'defender'){
            [...this.defenderUnits].forEach(unit => {
              if (!unit.active) return;
              const dx = unit.x - x;
              const dy = unit.y - y;
              if (Phaser.Geom.Circle.Contains(circle, unit.x, unit.y)) {
                // Восстанавливаем здоровье
                const data = unit.getData('unitData');
                data.currentHealth += healingAmount;
                if (data.currentHealth > data.maxHealth) {
                  data.currentHealth = data.maxHealth;
                }
                unit.setData('unitData', data);
                sendGameEvent('healingUnit', {
                  side: 'defender',
                  unitId: unit.getData('unitData').unit_index,
                  heal: healingAmount,
                 });
                changeHp(unit);
                showHealingEffect(unit.x, unit.y, healingAmount, this);
              }
            });
          }
        
      },
      loop: true
    });

    this.time.delayedCall(duration, () => {
      healingEvent.remove(false);
      updateEvent.remove(false);
      puddleGraphics.destroy();
    });
  }
}
