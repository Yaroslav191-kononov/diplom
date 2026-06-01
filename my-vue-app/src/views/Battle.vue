<script setup lang="ts">
import {
  IonPage, IonRouterOutlet, onIonViewWillEnter,
  ref, onMounted, onBeforeUnmount, watch, setupSocket, getCollections, getUnitAbilities, getUnits,
  addRandomTextures, setHexPlace, SetBorder, Phaser, apiFetch, showModal, MainSceneFunction, BattleScene,getFiles,getRandomUnitsWithCount
} from "@/views/Battle/Import";

interface Asset {
  key: string;
  url: string;
}

// Карты юниты и тд 
const gameContainer = ref<HTMLElement | null>(null);
let game: Phaser.Game | null = null;
let resourse: { stone: number, wood: number } = { stone: 30, wood: 30 };
let cards = ref<any[]>([]);
let units = ref<any[]>([]);
let unitsAbilities = ref<any[]>([]);
const showAbilities = ref(false);
(window as any).showAbilities = showAbilities;
(window as any).showResultModal = showResultModal;
const assets= ref<Asset[]>([

]);

// Способности игрока
const meteorCooldown = ref(0);
const lushCooldown = ref(0);
const abilityCooldownTime = 2500;
const isHoldingAbility = ref(false);
let whatsAbility="";

// Контроль круга
const circleActive = ref(false);
const circleX = ref(0);
const circleY = ref(0);
const circleCoords = ref<{ x: number; y: number } | null>(null);

function getCircleCoordinates() {
  const circleElement = document.querySelector('.circle');
  if (circleElement) {
    const rect = circleElement.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    return { x, y };
  }
  return null;
}

function handleMouseMove(e: MouseEvent) {
  if (circleActive.value) {
    circleX.value = e.clientX;
    circleY.value = e.clientY;
  }
}

function handleTouchMove(e: TouchEvent) {
  if (circleActive.value && e.touches.length > 0) {
    const touch = e.touches[0];
    circleX.value = touch.clientX+50;
    circleY.value = touch.clientY+50;
  }
}

function handleTouchStart(e: TouchEvent) {
  handleTouchMove(e);
}

function handleTouchEnd() {
  circleActive.value = false;
  let coords=getCircleCoordinates();
  const now = Date.now();
  whatsAbility=="triggerMeteorFall"?meteorCooldown.value = now:null;
  whatsAbility=="triggerHealingLush"?lushCooldown.value = now:null;
  if(coords!=null){
    setupSocket([coords], [] as any, whatsAbility as any, game!.scene as any);
  }
}

onMounted(async () => {
  await getCollections(cards, apiFetch);
  await getUnits(cards, units, apiFetch);
  await getUnitAbilities(units, apiFetch);
  await getFiles(assets, apiFetch);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('touchmove', handleTouchMove);
  window.addEventListener('touchstart', handleTouchStart);
  window.addEventListener('touchend', handleTouchEnd);
  if (gameContainer.value) initGame();
  else console.error('Контейнер игры не найден');
});

let sampleAttacker:any[] = [{
    "id": 6,
    "name": "Оруженосец",
    "card_id": 3,
    "health": 80,
    "power": 8,
    "wood": 0,
    "stone": 3,
    "meleeSpeed": 120,
    "isRange": 0,
    "range": null,
    "attackCooldown": 700,
    "image_url": "Veapon",
    "abilities": [
        {
            "ability_id": 1,
            "name": "Burn",
            "slug": "burn",
            "description": "DoT огня: 3 урона за тик на 3 тика",
            "type": "dot",
            "duration": 3,
            "damage_per_tick": 3,
            "apply_chance": 0.85,
            "cooldown": 0,
            "target": "enemy",
            "color": "#ff6b1a",
            "icon_path": "burn"
        }
    ],
    "count": 30,
    "currentHealth": 80
}];
const sampleDefender:any[] = [];
onBeforeUnmount(() => {
  if (game) { game.destroy(true); game = null; console.log('Phaser игра окончена'); }
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('touchmove', handleTouchMove);
  window.addEventListener('touchstart', handleTouchStart);
  window.addEventListener('touchend', handleTouchEnd);
});
function initGame() {
  try {
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: gameContainer.value as HTMLElement,
      width: window.innerWidth,
      height: window.innerHeight,pixelArt: true,
  
      physics: { default: 'arcade', arcade: { gravity: { y: 0,x:0 } } },
      scene: [BootScene, MainScene]
    });
    (window as any).game = game;
    console.log('Игра инициализирована');
  } catch (e) {
    console.error('Ошибка инициализации игры', e);
  }
  (window as any).__myUnit=sampleAttacker;
}
/* Boot сцена */
const BootScene = {
  key: 'Boot',
  preload() {
    assets.value.forEach(a => {
      if (!a.url) return console.error('Не указан URL для ассета:', a.key);
      (this as any).load.image(a.key, a.url);
    });
    const w = (this as any).scale.width;
    const h = (this as any).scale.height;
    const progressBar = (this as any).add.graphics();
    const progressBox = (this as any).add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(w / 4 - 10, h / 2 - 25, w / 2 + 20, 50);
    (this as any).load.on('progress', (value:number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(w / 4, h / 2 - 15, (w / 2) * value, 30);
    });
    (this as any).load.on('loaderror', (file:string) => console.error('Ошибка загрузки файла', file));
    (this as any).load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      (this as any).scene.start('Main');
    });
  }
};
/* Main сцена */
const MainScene = {
  key: 'Main',
  async create() {
    MainSceneFunction.call((this as any),resourse,units,cards,sampleAttacker,sampleDefender,startBattle);
  }
};

function startBattle(attackerUnits:any, defenderUnits:any, onFinish:Function) {
  showAbilities.value=true;
  (window as any).__battleData = { attackerUnits, defenderUnits };
  (window as any).__overData = undefined;
  if (!game!.scene.keys['BattleScene']) {
    game!.scene.add('BattleScene', BattleScene, false);
  }
  game!.scene.start('BattleScene');
  localStorage.setItem("role","attacker");
  // Проверяем завершение боя
  const checkIsWin = setInterval(() => {
    if ((window as any).__overData) {
      meteorCooldown.value = 0;
      lushCooldown.value = 0;
      showAbilities.value=false;
      game!.scene.stop('BattleScene');
      // Показываем окно с результатом
      showResultModal();
      if (onFinish) onFinish({ cancelled: false });
      clearInterval(checkIsWin);
    }
  }, 500);
}

// функция отображения окна с победителем
function showResultModal() {
  const overlay = document.createElement('div');

  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.0)';
  overlay.style.zIndex = '9998';
  overlay.style.pointerEvents = 'auto';
  document.body.appendChild(overlay);

  const modal = document.createElement('div');
  const gameContainerEl = document.getElementById('gameContainer');
  gameContainerEl!.style.pointerEvents = 'none';
  modal.innerHTML = `
    <div class="result-modal">
      <h2>Победитель</h2>
      <p id="winnerText"></p>
      <button id="closeBtn">Закрыть</button>
    </div>
  `;
  document.body.appendChild(modal);
  Object.assign(modal.style, {
    position: 'fixed',
    inset: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '9999',
    pointerEvents: 'auto',
  });
  Object.assign(((modal.children[0]) as any).style, {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '10px',
    maxWidth: '90%',
    width: '300px',
    textAlign: 'center',
    pointerEvents: 'auto',
  });
  const winner = (window as any).__overData;
  const winnerText = document.getElementById('winnerText');
  if (winner) {
    winnerText!.innerText = winner+' победили!';
  }
  modal.onclick = () => {
    (window as any).__overData=="Нападающие"?showCaptureEffect(((game as any).scene.getScene('Main') as any).hero.x, ((game as any).scene.getScene('Main') as any).hero.y):null;
    (window as any).__overData = "";
    document.body.removeChild(modal);
    document.body.removeChild(overlay);
  };
  overlay.onclick = () => {
    (window as any).__overData=="Нападающие"?showCaptureEffect(((game as any).scene.getScene('Main') as any).hero.x, ((game as any).scene.getScene('Main') as any).hero.y):null;
    (window as any).__overData = "";
    document.body.removeChild(modal);
    document.body.removeChild(overlay);
  };
}
// Анимация после захвата клетки
function showCaptureEffect(x: number, y: number) {
  if (!game || !game.scene.isActive('Main')) return;
  const scene = game.scene.getScene('Main');

  const effect = scene.add.graphics();
  effect.fillStyle(0xffcc66, 0.8);
  effect.fillCircle(0, 0, 20);
  effect.setPosition(x, y);
  effect.setDepth(1000);

  const startColor = Phaser.Display.Color.HexStringToColor('#FFCC66'); // песочно-жёлтый
  const endColor = Phaser.Display.Color.HexStringToColor('#99FF99'); // светло-зелёный

  scene.tweens.add({
    targets: { t: 0 },
    t: 1,
    duration: 1200,
    ease: 'Cubic.easeOut',
    onUpdate: (tween:any, target:any) => {
      const progress = target.t;
      const currentColor = Phaser.Display.Color.Interpolate.ColorWithColor(
        startColor,
        endColor,
        100,
        progress * 100
      );
      const colorHex = Phaser.Display.Color.GetColor(
        currentColor.r,
        currentColor.g,
        currentColor.b
      );
      effect.clear();
      effect.fillStyle(colorHex, 0.8);
      effect.fillCircle(0, 0, 20);
    },
    onComplete: () => {
      effect.destroy();
    }
  });

  scene.tweens.add({
    targets: effect,
    scaleX: 2.5,
    scaleY: 2.5,
    yoyo: true,
    repeat: 4,
    duration: 600,
    ease: 'Sine.easeInOut'
  });

  const glow = scene.add.graphics()
    .fillStyle(0x99FF99, 0.3);
  glow.fillCircle(0, 0, 30);
  glow.setPosition(x, y);
  glow.setDepth(999);

  scene.tweens.add({
    targets: glow,
    alpha: 0,
    scaleX: 1.5,
    scaleY: 1.5,
    duration: 1200,
    ease: 'Cubic.easeOut',
    onComplete: () => {
      glow.destroy();
    }
  });
}
const BattleBoot = {
  key: 'BattleBoot',
  preload() {
    assets.value.forEach(a => {
      if (!a.url) return console.error('Не указан URL для ассета:', a.key);
      (this as any).load.image(a.key, a.url);
    });
  },
  create() {
    (this as any).scene.start('BattleScene');
  }
};
localStorage.setItem("BattleBoot",JSON.stringify(BattleBoot));

function triggerMeteorFall() {
  const now = Date.now();
  if (now - meteorCooldown.value < abilityCooldownTime) {
    alert('Эта способность в кулдауне!');
    return;
  }
  circleActive.value = true;
  whatsAbility="triggerMeteorFall";
}

function triggerHealingLush() {
  const now = Date.now();
  if (now - lushCooldown.value < abilityCooldownTime) {
    alert('Эта способность в кулдауне!');
    return;
  }
  circleActive.value = true;
  whatsAbility="triggerHealingLush";
}


</script>
<style>
html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
}

#game-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#main {
  display: block !important;
  position: absolute;
  top: 0;
}
.Icobaton{
    position: relative;
  width: 80px !important;
  height: 80px !important;
  border-radius: 50%;
  padding: 0 !important;
  background-color: azure !important;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ability-icon {
  position: absolute;
  margin: 0;
  padding: 0;
  background-position: center;
    background-size: cover;
  background-position: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  z-index: 1;
  max-width: none;
}
</style>
<template>
  <ion-page>
    <div id="gameContainer" ref="gameContainer">

    </div>
    <div v-if="showAbilities" class="abilities-container" style="position: fixed; top: 10px; left: 50%; transform: translateX(-50%); z-index: 9999; display: flex; gap: 10px;">
    <ion-button 
  :disabled="Date.now() - meteorCooldown < abilityCooldownTime" 
  @click="triggerMeteorFall" 
  @touchstart.prevent="triggerMeteorFall"
  class="Icobaton"
>
  <img src="http://localhost:3000/images/icon_meteor.png" alt="" class="ability-icon">
  <span v-if="Date.now() - meteorCooldown < abilityCooldownTime"> перезарядка </span>
</ion-button>
<ion-button 
  :disabled="Date.now() - lushCooldown < abilityCooldownTime" 
  @click="triggerHealingLush" 
  @touchstart.prevent="triggerHealingLush"
  class="Icobaton"
>
  <img src="http://localhost:3000/images/icon_pool.png" alt="" class="ability-icon">
  <span v-if="Date.now() - lushCooldown < abilityCooldownTime"> перезарядка </span>
</ion-button>
    </div>
        <div
      v-if="circleActive"
      class="circle"
      :style="{
        position: 'fixed',
        top: circleY - 150 + 'px',
        left: circleX - 150 + 'px',
        width: '200px',
        height: '200px',
        backgroundColor: 'yellow',
        borderRadius: '50%',
        opacity: 0.7,
        pointerEvents: 'none',
        zIndex: 9998
      }"
    ></div>
  </ion-page>
</template>