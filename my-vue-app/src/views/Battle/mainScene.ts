import  {
  setupSocket,getCollections,getUnitAbilities,getUnits,
  addRandomTextures, setHexPlace, SetBorder,Phaser,apiFetch,showModal, placeSummon,BattleScene,findNeighbors,showAttachUnitsLauncher,updateTaskCurrent
} from "@/views/Battle/Import";
let numberOfUnits:number = 3;

type HexCell = {
  id?: number;
  x: number;
  y: number;
  img: Phaser.GameObjects.Image;
  isCaptured?: boolean;
  lastCollectedTime?: number;
  texture?: string;
  resourceType?: string;
  [key: string]: any;
};

type HexArrType = [HexCell[], number, number];

type SceneWithUnits = Phaser.Scene & {
  playerTop?: Phaser.GameObjects.Image;
  playerBottom?: Phaser.GameObjects.Image;
  hero?: Phaser.GameObjects.Image;
  evil?: Phaser.GameObjects.Image;
  statusMessage?: { value: string };
};

const resourceTextStyle = {
  fontSize: '20px',
  color: '#ffffff',
  stroke: '#000000',
  strokeThickness: 3,
  shadow: {
    offsetX: 2,
    offsetY: 2,
    color: '#000000',
    blur: 2,
    stroke: true,
    fill: true
  }
};

let progressBg:Phaser.GameObjects.Sprite;
let progressBar:Phaser.GameObjects.Sprite;

export async function MainSceneFunction(
  this: SceneWithUnits,
  resourse:{ stone:number, wood:number},
  units:any,
  cards:any,
  sampleAttacker:any,
  sampleDefender:any,
  startBattle:Function
): Promise<void> {
  // Проверка ассетов
  const need = ["background", "place", "player", "Forest", "Stone", "StoneForest"];
  for (const i of need) {
    if (!this.textures.exists(i)) {
      console.error('Ресурс не загружен', i);
      return;
    }
  }
  (this as any).textureGroup = this.add.group();
  // фон/слой карты
  this.add.image(this.scale.width / 2, this.scale.height / 2, 'background')
    .setDisplaySize(this.scale.width, this.scale.height);

  (this as any).setHexPlace = (setHexPlace as any).bind(this);

  const startX = 50, maxX = this.scale.width - 10;
  const startY = 50, maxY = this.scale.height - 60;
  const scale = 1;

  const hexData = (this as any).setHexPlace(startX, maxX, startY, maxY, scale) as HexArrType;

(this as any).stoneText = this.add.text(21, 10, 'Камень:' + resourse.stone, resourceTextStyle).setDepth(10000000);
(this as any).woodText = this.add.text(21, 40, 'Дерево:' + resourse.wood, resourceTextStyle).setDepth(10000000);

const stoneGraphics = this.add.graphics()
  .fillStyle(0x999999, 1)
  .fillRoundedRect(0, 0, 10, 10, 8)
  .setDepth(10);

const glow = this.add.graphics()
  .fillStyle(0xffffff, 0.2)
  .fillCircle(5, 5, 8)
  .setBlendMode(Phaser.BlendModes.ADD)
  .setDepth(5);

const stoneContainer = this.add.container(7, 16, [stoneGraphics, glow]);

const treeGraphics = this.add.graphics()
  .fillStyle(0x8B4513, 1)
  .fillRoundedRect(0, 0, 10, 10, 8);

const treeGlow = this.add.graphics()
  .fillStyle(0xffffff, 0.3)
  .fillCircle(5, 5, 8)
  .setBlendMode(Phaser.BlendModes.ADD);

const treeContainer = this.add.container(7, 47, [treeGraphics, treeGlow]);

  (this as any).resourceCollectTimer = this.time.addEvent({
    delay: 3000,
    callback: () => {
      const currentTime = this.time.now;
      hexData[0].forEach((hex: HexCell) => {
        if (hex.isCaptured && (!hex.lastCollectedTime || currentTime - hex.lastCollectedTime >= 3000)) {
          giveResourceToPlayer(hex.resourceType, this);
          hex.lastCollectedTime = currentTime;
        }
      });
    },
    loop: true
  });

  function giveResourceToPlayer(type: string | undefined, scene: Phaser.Scene) {
    if (type === "stone") ++resourse.stone;
    if (type === "wood") ++resourse.wood;
    if (type === "stone&wood") { ++resourse.stone; ++resourse.wood; }
    (scene as any).stoneText.setText('Камень:' + resourse.stone);
    (scene as any).woodText.setText('Дерево:' + resourse.wood);
  }

  // центр: сверху и снизу
  const topIndex = Math.round(hexData[1] / 2);
  const bottomIndex = ((hexData[2] + 1) * (hexData[1] + 1) - 1) - topIndex;

  // Спавн игроков
  const topMid = hexData[0][topIndex];
  const bottomMid = hexData[0][bottomIndex];
  if (!topMid || !bottomMid) {
    console.error('Не найдены клетки для игроков', topMid, bottomMid);
    return;
  }

  const tileW = 86 * scale;
  const tileH = 100 * scale;


  await setupSocket([scale, hexData, topIndex, bottomIndex], hexData, "rndTexture", this);
  (this as any).playerTop = topMid.img
  .setTexture('evilHeart')
  .setInteractive()
  .setDepth(2000);
  (this as any).playerBottom = bottomMid.img
  .setTexture('playerHeart')
  .setInteractive()
  .setDepth(1200);
  (this as any).playerBottom.on('pointerup', () => {
    showAttachUnitsLauncher(hexData,this,(this as any).playerBottom,sampleAttacker, {
      width: screen.availWidth * 0.9,
      height: screen.availHeight*0.9,
      title: "оставить юнита",
    });
  });
  (this as any).hero = this.add.image(bottomMid.x, bottomMid.y, 'Hero')
    .setDisplaySize(50, 50)
    .setDepth(3000)
    .setInteractive();
  (this as any).hero.cell = bottomMid;

  (this as any).evil = this.add.image(topMid.x, topMid.y, 'evil')
    .setDisplaySize(50, 50)
    .setDepth(3000)
    .setInteractive();

  let check = true;
  let end = true;

  (this as any).hero.on('pointerup', () => {
    const neighbors = findNeighbors(hexData[0], hexData[1] + 1, hexData[2] + 1, { x: (this as any).hero.x, y: (this as any).hero.y });

    if (check) {
      check = false;
      // подсветка соседних клеток
      Object.values(neighbors).forEach(async (cell: HexCell | undefined) => {
        if (!cell) return;
        cell.img.setTint(0xffff00).setInteractive();
        cell.img.once('pointerup', () => {
          end = false;
          Object.values(neighbors).forEach((elem) => elem?.img.clearTint().removeAllListeners('pointerup'));

          // прогресс-бар над героем
          const progressBarWidth = 70;
          const progressBarHeight = 10;
          progressBg = (this as any).hero.scene.add.graphics();
          progressBar = (this as any).hero.scene.add.graphics();

          const lastCell = (this as any).hero.cell;
          const x = (this as any).hero.x - progressBarWidth / 2;
          const y = (this as any).hero.y - (this as any).hero.displayHeight / 2 - 20;

          (progressBg as any).fillStyle(0x222222, 0.8);
          (progressBg as any).fillRect(x, y, progressBarWidth, progressBarHeight).setDepth(2000);

          let progress = 0;
          const duration = 2000;
          const stepTime = 50;

          const timer = (this as any).hero.scene.time.addEvent({
            delay: stepTime,
            repeat: Math.floor(duration / stepTime) - 1,
            callback: async () => {
              progress += stepTime / duration;
              (progressBar as any).clear();
              (progressBar as any).fillStyle(0x00ff00, 1);
              (progressBar as any).fillRect(x, y, progressBarWidth * progress, progressBarHeight).setDepth(2100);
              if (progress >= 1) {
                end = true;
                check = true;
                
                updateTaskCurrent('Первый шаг', 1);
                updateTaskCurrent('Стратег', 1);

                await setupSocket([{ cell: cell.id, textures: cell.img.texture.key }], hexData, "Move", this);
                if (cell.img.texture.key == "place" || cell.img.texture.key == "StoneForest" || cell.img.texture.key == "Stone" || cell.img.texture.key == "Forest") {
                  if (await isEnemyHere(this, lastCell, hexData,startBattle,cell)) return;
                  let arr: any[] = [];
                  const allUnits = [].concat(...units.value);
                  let sampleDefender = getRandomUnitsWithCount(allUnits, numberOfUnits);
                  startBattle(sampleAttacker, sampleDefender, async () => {
                    console.log((window as any).__overData);
                    sampleAttacker=(window as any).__Attacker;
                    sampleDefender=(window as any).__Defender;
                    if ((window as any).__overData == "Нападающие") {
                      updateTaskCurrent('Боец', 1);
                      cell.img.setInteractive();
                      if (cell.img.texture.key == "place") {
                        arr.push({ cell: cell.id, textures: "player" });
                        cell.img.on('pointerup', () => {
                          cell.img.setData("id",cell.id);
                          showModal(this, cards.value, cell.img, units.value, sampleAttacker, resourse,hexData);
                        });
                      } 
                      else {
                        cell.isCaptured = true;
                        updateTaskCurrent('Захватчик', 1);
                        if (cell.img.texture.key == "StoneForest") {
                          cell.resourceType = "stone&wood";
                          updateTaskCurrent('Шахтёр', 1);
                          updateTaskCurrent('Экспансия', 1);
                          updateTaskCurrent('Добытчик', 1);
                        } else if (cell.img.texture.key == "Forest") {
                          cell.resourceType = "wood";
                          updateTaskCurrent('Добытчик', 1);
                          updateTaskCurrent('Экспансия', 1);
                        } else if (cell.img.texture.key == "Stone") {
                          updateTaskCurrent('Экспансия', 1);
                          updateTaskCurrent('Шахтёр', 1);
                          cell.resourceType = "stone";
                        }
                        arr.push({ cell: cell.id, textures: cell.img.texture.key });
                      }
                      hexData[0].forEach(elem => {
                        elem.img.texture.key == "player" && !(elem.img as any)._events.pointerup
                          ? elem.img.on('pointerup', () => {
                              elem.img.setData("id",elem.id);
                              showModal(this, cards.value, elem.img, units.value, sampleAttacker, resourse,hexData);
                            })
                          : null;
                      });
                      (hexData[0] as HexCell[]).forEach(elem => {
                        (cards.value as any[]).forEach(card => {
                          if (elem.img.texture.key == card.image_url && !(elem.img as any)._events.pointerup) {
                            const isMobile = screen.availWidth < 768;
                            elem.img.on('pointerup', () =>
                              elem.img.setData("id",elem.id),
                              showModal(this, units.value, elem.img, cards.value, sampleAttacker, resourse,hexData, placeSummon, {
                                width: isMobile ? screen.availWidth * 0.9 : 800,
                                height: isMobile ? screen.availHeight * 0.8 : 600,
                                title: "выбери юнита",
                                card: card.id
                              })
                            );
                          }
                        });
                      });
                      await setupSocket(arr, hexData, "capture", this);
                    } 
                    else {
                      await setupSocket([{ cell: lastCell.id, textures: lastCell.img.texture.key }], hexData, "Move", this);
                    }
                  });
                }
                else if (cell.img.texture.key == "enemy" || cell.img.texture.key == "enemyStone" || cell.img.texture.key == "enemyStoneForest" || cell.img.texture.key == "enemyForest"){
                    if (await isEnemyHere(this, lastCell, hexData,startBattle,cell)) return;
                    updateTaskCurrent('Разрушитель', 1);
                    await setupSocket([{ cell: cell.id, textures: "cross" }], hexData, "Destroy", this);
                  }
                else if (cell.img.texture.key == "enemyHeart"){
                    if (await isEnemyHere(this, lastCell, hexData,startBattle,cell)) return;
                    await setupSocket([sampleAttacker, (cell.img as any).units ?? []],hexData, "HeartFight", this);
                    setTimeout(async ()=>{
                      const evilHeart=hexData[0].filter(elem=>elem.img.texture.key=="enemyHeart");
                      startBattle((window as any).__Attacker, (evilHeart[0] as any).units, async () => {
                        console.log((window as any).__overData);
                        if ((window as any).__overData == "Нападающие") {
                          updateTaskCurrent('Боец', 1);
                          updateTaskCurrent('Победитель', 1);
                          setupSocket([lastCell], hexData, "Win", this);
                        } 
                        else {
                          setupSocket([lastCell], hexData, "HeroDestroy", this);
                        }
                      });
                  },2500);
                  }
               else if (cell.img.texture.key.startsWith("enemy")){
                  if (await isEnemyHere(this, lastCell, hexData,startBattle,cell)) return;
                  let currentBuildind= cell.img.texture.key.replace("enemy", "")[0].toLowerCase()+cell.img.texture.key.replace("enemy", "").slice(1);
                  let based=cards.value.filter((elem:any)=>elem.image_url==currentBuildind);
                  console.log(units.value.filter((elem:any)=>elem[0].card_id==based[0].card_id));
                  based.units=units.value.filter((elem:any)=>elem[0].card_id==based[0].card_id);
                  startBattle(sampleAttacker, [based], async () => {
                    sampleAttacker=(window as any).__Attacker;
                    sampleDefender=(window as any).__Defender;
                    if ((window as any).__overData == "Нападающие") {
                      updateTaskCurrent('Боец', 1);
                      updateTaskCurrent('Разрушитель', 1);
                      await setupSocket([{ cell: cell.id, textures: "cross" }], hexData, "Destroy", this);
                    } 
                    else {
                      await setupSocket([{ cell: lastCell.id, textures: lastCell.img.texture.key }], hexData, "Move", this);
                    }
                  });
                  }
                progressBg.destroy();
                progressBar.destroy();
              }
            }
          });
        });
      });
    } else {
      // повторное нажатие
      if (end) {
        check = true;
      }
      Object.values(neighbors).forEach((elem) => elem?.img.clearTint().removeAllListeners('pointerup'));
      (hexData[0] as HexCell[]).forEach(elem => {
        elem.img.texture.key == "player" && !(elem.img as any)._events.pointerup
          ? elem.img.on('pointerup', () => {
              showModal(this, cards.value, elem.img, units.value, sampleAttacker, resourse,hexData);
            })
          : null;
      });
  (this as any).playerBottom.on('pointerup', () => {
    showAttachUnitsLauncher(hexData,this,(this as any).playerBottom,sampleAttacker, {
      width: screen.availWidth * 0.9,
      height: screen.availHeight*0.9,
      title: "оставить юнита",
    });
  });
      (cards.value as any[]).forEach(card => {
        (hexData[0] as HexCell[]).forEach(elem => {
          if (elem.img.texture.key == card.image_url && !(elem.img as any)._events.pointerup) {
            const isMobile = screen.availWidth < 768;
            elem.img.on('pointerup', () =>
              showModal(this, units.value, elem.img, cards.value, sampleAttacker, resourse,hexData, placeSummon, {
                title: "выбери юнита",
                card: card.id
              })
            );
          }
        });
      });
    }
  });
}
function isEnemyHere(scene: Phaser.Scene,lastCell: HexCell,hex: HexArrType,startBattle: Function,cell: HexCell): Promise<boolean> {
  return new Promise((resolve) => {
    progressBg.destroy();
    progressBar.destroy();
    setTimeout(async () => {
      if ((scene as any).evil.x === (scene as any).hero.x && (scene as any).evil.y === (scene as any).hero.y) {
        setupSocket([lastCell.id], hex, "Fight", scene);
          setTimeout(async ()=>{
            startBattle((window as any).__Attacker, (window as any).__OtherArmy, async () => {
              console.log((window as any).__overData);
              if ((window as any).__overData == "Нападающие") {
                setupSocket([lastCell], hex, "EvilDestroy", scene);
                (scene as any).hero.y=lastCell.img.y;
                (scene as any).hero.x=lastCell.img.x;
              } 
              else {
                setupSocket([lastCell], hex, "HeroDestroy", scene);
              }
            });
        },2500)
      } else {
        resolve(false); 
      }
    }, 100);
  });
}
setInterval(() => {
  numberOfUnits += 2;
  console.log(`количество: ${numberOfUnits}`);
}, 30000);
//тасование массива
function shuffle(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
//получения массива юнитов с учетом count
export function getRandomUnitsWithCount(unitsArray: any[], count: number) {
  const shuffled = shuffle([...unitsArray]);
  const result:any[] = [];
  for(let i:number=0;i<count;i++){
    const unit=shuffled[Math.floor(Math.random() * (shuffled.length))];
    const existing = result.find(u => {
      return u.id === unit.id
    })
    if (existing) {
      existing.count += 1;
    } else {
      result.push({ ...unit, count: 1 });
    }
  }
  return result;
}