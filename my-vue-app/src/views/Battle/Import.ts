export { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet, onIonViewWillEnter } from '@ionic/vue';
// Vue
export { ref, onMounted, onBeforeUnmount, watch } from 'vue';
// Утилиты
export { addRandomTextures, setHexPlace, SetBorder } from '@/utilit/gameUtils';
export { showModal, placeSummon,showAttachUnitsLauncher } from '@/utilit/modalUtils';
// Phaser
export { default as Phaser } from 'phaser';
//Battle
export { setupSocket } from '@/views/Battle/Socket';
export { updateTaskCurrent } from '@/views/Battle/updateTaskCurrent';
export { startBattle } from '@/views/Battle/battleScene/startBattle';
export {  getCollections,getUnitAbilities,getUnits,getFiles} from '@/views/Battle/onMount';
// Fetch
export { apiFetch } from '@/utilit/fetchUtils.js';
export {MainSceneFunction,getRandomUnitsWithCount} from '@/views/Battle/mainScene.js';
export {BattleScene} from '@/views/Battle/batleInBattle';
export {ReplayScene} from '@/views/Battle/battleScene/replayBattle';
// MAin
export {findNeighbors} from '@/views/Battle/mainScene/findNeighbors';
export type {HexCell,HexArrType} from '@/views/Battle/mainScene/findNeighbors';
// FORBattle
export {addHpBar} from '@/views/Battle/battleScene/addHpBar';
export {changeHp} from '@/views/Battle/battleScene/changeHp';
export {showDamage} from '@/views/Battle/battleScene/showDamage';
export {showHealingEffect} from '@/views/Battle/battleScene/showHealingEffect';
export {updateHpBar} from '@/views/Battle/battleScene/updateHpBar';
export {Effect} from '@/views/Battle/battleScene/Effect';
// socket
export {  } from '@/views/Battle/Socket';