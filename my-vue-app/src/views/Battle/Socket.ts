import Peer from 'simple-peer'; 
import  {
  startBattle,ReplayScene
} from "@/views/Battle/Import";
import { useRouter } from 'vue-router';
const router=useRouter();
type TileImg = {
  img: Phaser.GameObjects.Image;
};
const peerInstances: Map<string, any> = new Map();
(window as any).gameEvents = (window as any).gameEvents || {};
type HexArrType = [
  TileImg[],
  number, 
  number  
];
type SceneWithUnits = Phaser.Scene & {
  playerTop?: Phaser.GameObjects.Image;
  playerBottom?: Phaser.GameObjects.Image;
  hero?: Phaser.GameObjects.Image;
  evil?: Phaser.GameObjects.Image;
  statusMessage?: { value: string };
};
let crutch=true;
export let socket: WebSocket = new WebSocket('ws://localhost:3000');
export function setupSocket(
  Arr: any[],
  HexArr: HexArrType,
  type: 'rndTexture' | 'capture' | 'Move' | 'Building' | 'Destroy' | "HeartFight" | "Fight" | "HeroDestroy" | "EvilDestroy"| "Win" | "setHeartUnits" | "triggerMeteorFall" | "triggerHealingLush",
  scene: SceneWithUnits,
): void {
  socket = new WebSocket('ws://localhost:3000');
  const getAuth = (): string | null => localStorage.getItem('auth');
  socket.onopen = () => {
    //stun:stun.l.google.com:19302
    let message: any = null;
    const auth = getAuth();
    if (type === 'rndTexture') {
      message = { arr: Arr, type: 'setRandomTexture', id: auth };
    } else if (type === 'capture') {
      message = { arr: Arr, HexArr, type: 'capture', id: auth };
    } else if (type === 'Move') {
      message = { arr: Arr, type: 'Move', HexArr, id: auth };
    }
    else if (type === 'Building') {
      message = { arr: Arr, type: 'Building', HexArr, id: auth };
    }
    else if (type === 'Destroy') {
      message = { arr: Arr, type: 'Destroy', HexArr, id: auth };
      message.arr.map((elem:any)=>console.log(elem));
    }
    else if (type === 'Fight') {
      message = { arr: Arr, type: 'Fight', HexArr, id: auth };
      message.arr.map((elem:any)=>console.log(elem));
    }
    else if (type === 'HeroDestroy') {
      message = { arr: Arr, type: 'HeroDestroy', HexArr, id: auth };
      message.arr.map((elem:any)=>console.log(elem));
    }
    else if (type === 'EvilDestroy') {
      message = { arr: Arr, type: 'EvilDestroy', HexArr, id: auth };
      message.arr.map((elem:any)=>console.log(elem));
    }
    else if (type === 'HeartFight') {
      message = { arr: Arr, type: 'HeartFight', HexArr, id: auth,currentID:auth };
      message.arr.map((elem:any)=>console.log(elem));
    }
    else if (type === 'setHeartUnits') {
      message = { arr: Arr, type: 'setHeartUnits', HexArr, id: auth };
    }
    else if (type === 'Win') {
      message = { arr: Arr, type: 'Win', HexArr, id: auth };
    }
    else if (type === 'triggerMeteorFall') {
      message = { arr: Arr, type: 'triggerMeteorFall', HexArr, id: auth };
    }
    else if (type === 'triggerHealingLush') {
      message = { arr: Arr, type: 'triggerHealingLush', HexArr, id: auth };
    }
    if (message) {
      const interval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          clearInterval(interval);
          socket.send(JSON.stringify(message));
        }
      }, 30);
    }
  };

  socket.onmessage = async (event: MessageEvent) => {
    const data: any = JSON.parse(event.data);
    if (data.type === 'rndTexture') {
      localStorage.setItem("isTwo",undefined as any);
      localStorage.setItem("isHeart",undefined as any);
      HexArr[0].forEach((elem: TileImg) => elem.img.setTexture('place'));
      data.elems?.forEach((elem: { cell: number; textures: string }) => {
        HexArr[0][elem.cell]?.img.setTexture(elem.textures);
      });

      const topIndex = Math.round(HexArr[1] / 2);
      const bottomIndex = ((HexArr[2] + 1) * (HexArr[1] + 1) - 1) - topIndex;

      (scene as SceneWithUnits).playerTop = HexArr[0][topIndex]?.img
        ?.setTexture('enemyHeart')
        ?.setInteractive();

      (scene as SceneWithUnits).playerBottom = HexArr[0][bottomIndex]?.img
        ?.setTexture('playerHeart')
        ?.setInteractive();
    } else if (data.type === 'capture') {
      if (data.arr?.[0]?.textures === 'player') {
        HexArr[0][data.arr[0].cell].img.setTexture(data.typeCell).setInteractive();
      } else {
        HexArr[0][data.arr[0].cell].img.setTexture(data.typeCell + data.arr[0].textures).setInteractive();
      }
    } else if (data.type === 'Move') {
      if (data.who === 'hero') {
        scene.hero!.x = HexArr[0][data.arr[0].cell].img.x;
        scene.hero!.y = HexArr[0][data.arr[0].cell].img.y;
        (scene.hero as any)!.cellId=data.arr[0].cell;
      } else {
        scene.evil!.x = HexArr[0][data.arr[0].cell].img.x;
        scene.evil!.y = HexArr[0][data.arr[0].cell].img.y;
        (scene.evil as any)!.cellId=data.arr[0].cell;
      }
    }
    else if (data.type === 'Building') {
      if (data.who === 'hero') {
        HexArr[0][data.arr[0].cell].img.setTexture(data.arr[0].textures);
      } else {
        HexArr[0][data.arr[0].cell].img.setTexture("enemy"+data.arr[0].textures[0].toUpperCase()+data.arr[0].textures.slice(1,data.arr[0].textures.length));
      }
    }
    else if (data.type === 'Destroy') {
      (HexArr[0][data.arr[0].cell] as any).resourceType=undefined;
      (HexArr[0][data.arr[0].cell].img as any).removeAllListeners()
      HexArr[0][data.arr[0].cell].img.setTexture(data.arr[0].textures);
    }
    else if (data.type === 'Fight') {
      socket.send(JSON.stringify({units:(window as any).__myUnit,type:"startFight",HexArr,id:data.id,currentID:localStorage.getItem('auth')}));
    }
    else if (data.type === 'HeroDestroy') {
      localStorage.setItem("isTwo",undefined as any);
      scene.hero?.setActive(false);
      setTimeout(()=>{
        const topIndex = Math.round(HexArr[1] / 2);
        const bottomIndex = ((HexArr[2] + 1) * (HexArr[1] + 1) - 1) - topIndex;
        const bottomMid = HexArr[0][bottomIndex];
        scene.hero!.x = (bottomMid as any).x;
        scene.hero!.y = (bottomMid as any).y;
        scene.hero?.setActive(true);
      },1000);
    }
    else if (data.type === 'EvilDestroy') {
      localStorage.setItem("isTwo",undefined as any);
      scene.evil?.setActive(false);
      setTimeout(()=>{
        const topIndex = Math.round(HexArr[1] / 2);
        const topMid = HexArr[0][topIndex];
        scene.evil!.x = (topMid as any).x;
        scene.evil!.y = (topMid as any).y;
        scene.evil?.setActive(true);
      },1000);
    }
    else if (data.type === 'setHeartUnits') {
      const evilHeart=HexArr[0].filter(elem=>elem.img.texture.key=="enemyHeart");
      (evilHeart[0] as any).units=data.arr; 
    }
    else if (data.type === 'setMyHeartUnits') {
      const evilHeart=HexArr[0].filter(elem=>elem.img.texture.key=="playerHeart");
      (evilHeart[0] as any).units=data.arr; 
    }
    else if(data.type=="Win"){
      window.location.assign('/tabs/resalt');
      localStorage.setItem("isWin",(true).toString());
    }
    else if(data.type=="Lose"){
      window.location.assign('/tabs/resalt');
      localStorage.setItem("isWin",(false).toString());
    }
    else if (data.type === 'triggerMeteorFall') {
      (window as any).gameEvents = {
        triggerMeteorFall: data
      };
    } else if (data.type === 'triggerHealingLush') {
    (window as any).gameEvents = {
        triggerHealingLush: data
      };
    }
    else if (data.type === 'startFight') {
      localStorage.setItem("isTwo","true");
      if(data.currentID!=getAuth()){
        (window as any).__OtherArmy=data.units;
        localStorage.setItem("role","defender");
      }
      if(data.id==getAuth() && crutch){
        crutch=false;
      }
    }
    else if (data.type === 'PrepairHeart') {
      localStorage.setItem("isTwo","true");
      localStorage.setItem("isHeart","true");
      if(data.currentID!=getAuth()){
        (window as any).__OtherArmy=data.units;
        localStorage.setItem("role","defender");
      }
      if(data.id==getAuth() && crutch){
        crutch=false;
      }
    }
    else if(data.type=="unitSpawn" || data.type=="healingLush" || data.type=="unitDestroyed" || data.type=="damage" || data.type=="moveUnit" || data.type=="healingUnit" || data.type=="effect" || data.type=="endBattle" || data.type=="meteorFall"){
        if (!((window as any).game.scene.keys['ReplayScene'])) {
          (window as any).showAbilities.value=true;
          (window as any).game.scene.add('ReplayScene', ReplayScene, false);
          if(localStorage.getItem("isHeart")=="true"){
            const evilHeart=HexArr[0].filter(elem=>elem.img.texture.key=="playerHeart");
            console.log(evilHeart);
                        console.log((evilHeart[0] as any).units );
                        console.log((window as any).__OtherArmy );
            (window as any).game.scene.start('ReplayScene',{
              unitsData: { attackerUnits: (window as any).__OtherArmy, defenderUnits: (evilHeart[0] as any).units }
            });
          }
          else{
            (window as any).game.scene.start('ReplayScene',{
              unitsData: { attackerUnits: (window as any).__OtherArmy, defenderUnits: (window as any).__Attacker }
            });
          }
            const checkIsWin = setInterval(() => {
              localStorage.setItem("isTwo",undefined as any);
              localStorage.setItem("isHeart",undefined as any);
              if ((window as any).__overData) {
                (window as any).showAbilities.value=false;
                (window as any).game!.scene.stop('ReplayScene');
                // Показываем окно с результатом
                (window as any).showResultModal();
                clearInterval(checkIsWin);
              }
          }, 500);
        }
        else{
          (window as any).game.scene.keys['ReplayScene'].handleMessage(data);
        }
    }
  }
  socket.onerror = () => {
    if (scene.statusMessage) {
      scene.statusMessage.value = 'Ошибка соединения.';
    }
  };

  socket.onclose = () => {
    console.log('socket closed');
  };

}