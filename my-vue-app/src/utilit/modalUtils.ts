import {setupSocket} from "@/views/Battle/Import";
import type {HexCell,HexArrType} from "@/views/Battle/Import";
import {updateTaskCurrent} from "@/views/Battle/Import";
// Базовые интерфейсы 
export interface CardInfo {
  image_url: string;
  id:number;
  name?: string;
  health: number;
  power: number;
  wood: number;
  stone: number;
  card_id?: number;
  rarity?: string;
}

export interface ResourceState {
  wood: number;
  stone: number;
}

export interface ModalOptions {
  width?: number;
  height?: number;
  title?: string;
  buttonText?: string;
  card?: number;
  [key: string]: any;
}

// Основные экспортируемые набор функций

// Окно модального выбора (мобильная версия)
export function showModal(
  scene: Phaser.Scene,
  cards: any[], 
  player: Phaser.GameObjects.GameObject,
  units: any[],
  sampleAttacker: any[],
  resource: ResourceState,
  HexArr:HexArrType,
  fun: any = addSelect,
  options: ModalOptions = {}
): void {
  const w = scene.scale.width;
  const h = scene.scale.height;
  const isMobile = w < 768;
  const uiScale = Math.max(0.7, Math.min(w / 430, 1));
  
  // Адаптивные размеры для мобильных
  const boxW =  Math.min(w * 0.92, isMobile ? 380 : 900);
  const boxH =  Math.min(h * 0.85, isMobile ? 720 : 800);
  const title = options.title ?? 'Магазин';
  
  // Полупрозрачный фон
  const bg = scene.add.rectangle(0, 0, w, h, 0x000000, 0.5)
    .setOrigin(0)
    .setDepth(5000)
    .setInteractive();

  // Контейнер для модального окна
  const container = scene.add.container(w / 2, h / 2).setDepth(6000);
  container.alpha = 0;
  container.scale = 0.9;

  // Основной контейнер с закруглёнными углами
  const box = scene.add.graphics();
  const radius = isMobile ? 20 : 24;
  
  // Фон модалки
  box.fillStyle(0xf7f8fb, 1);
  box.fillRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, radius);
  
  // Тень
  box.fillStyle(0x000000, 0.1);
  box.fillRoundedRect(-boxW / 2 + 3, -boxH / 2 + 3, boxW, boxH, radius);
  
  // Заголовок с градиентом
  const titleBg = scene.add.graphics();
  titleBg.fillStyle(0x6d9cff, 1);
  titleBg.fillRoundedRect(-boxW / 2, -boxH / 2, boxW, isMobile ? 50 : 60, 
    { tl: radius, tr: radius, bl: 0, br: 0 });
  
  const titleText = scene.add.text(
    0,
    -boxH / 2 + (isMobile ? 25 : 30),
    title,
    {
      fontFamily: 'Arial, sans-serif',
      fontSize: isMobile ? '18px' : '20px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    }
    
  ).setOrigin(0.5);

  // Кнопка закрытия (увеличенная для мобильных)
  const closeBtnSize = isMobile ? 20 : 16;
  const closeBtn = scene.add.graphics();
  closeBtn.fillStyle(0xf7f8fb, 1);
  closeBtn.fillCircle(0, 0, closeBtnSize);
  
  const closeIcon = scene.add.text(0, 0, '×', {
    fontFamily: 'Arial',
    fontSize: isMobile ? '28px' : '24px',
    color: '#212529'
  }).setOrigin(0.5);
  
  const closeButton = scene.add.container(boxW / 2 - (isMobile ? 35 : 30), 
    -boxH / 2 + (isMobile ? 25 : 30), [closeBtn, closeIcon]);
  closeButton.setInteractive(new Phaser.Geom.Circle(0, 0, isMobile ? 30 : 20), 
    Phaser.Geom.Circle.Contains);
  
  // Контейнер для контента
  const contentContainer = scene.add.container(0, 25);

  const closeModal = () => {
    scene.tweens.add({
      targets: container,
      alpha: 0,
      scale: 0.9,
      ease: 'Cubic.In',
      duration: 200,
      onComplete: () => {
        container.destroy();
        bg.destroy();
      }
    });
  };

  closeButton.on('pointerup', closeModal);
  bg.on('pointerup', closeModal);

  // Вызов содержимого модального окна
  fun(scene, contentContainer, cards, isMobile ? 0.7 : 0.8, player, closeModal, 
    units, sampleAttacker, options, resource,HexArr);
  container.add([box, titleBg, titleText, closeButton, contentContainer]);
  if (isMobile) {
    container.setScale(uiScale);
  }
  // Анимация появления
  scene.tweens.add({
    targets: container,
    alpha: 1,
    scale: 1,
    ease: 'Back.Out',
    duration: 300
  });

}

// Добавление ряда карточек в модальном окне (мобильная версия)
export function addSelect(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  cards: CardInfo[],
  scale: number,
  player: Phaser.GameObjects.GameObject,
  closeModal: () => void,
  units: any[],
  sampleAttacker: any[],
  options: ModalOptions,
  resource: ResourceState,
  HexArr:HexArrType
): void {
  const w = scene.scale.width;
  const h = scene.scale.height;
  const isMobile = w < 768;
  
  const cardContainer = scene.add.container(0, isMobile ? 20 : 30);
  
  // Вертикальное расположение карточек
  const cardWidth = isMobile ? Math.min(w * 0.88, 340) : 320;
  const cardHeight = isMobile ? 140 : 220;
  const cardSpacing = 15;
  
  // Начальная позиция Y для первой карточки
  let currentY = -250;
  
  cards.forEach((card, index) => {
    // Позиция X всегда по центру (0), Y увеличивается с каждой карточкой
    const x = 0;
    const y = currentY;
    
    // Создаем карточку
    const cardGroup = scene.add.container(x, y);
    
    // Фон карточки
    const cardBg = scene.add.graphics();
    cardBg.fillStyle(0xffffff, 1);
    cardBg.fillRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, isMobile ? 12 : 16);
    
    // Тень
    cardBg.fillStyle(0x000000, 0.08);
    cardBg.fillRoundedRect(-cardWidth / 2 + 3, 3, cardWidth, cardHeight, isMobile ? 12 : 16);
    
    // Заголовок с градиентом
    const headerBg = scene.add.graphics();
    headerBg.fillStyle(0x6d9cff, 1);
    headerBg.fillRoundedRect(-cardWidth / 2, 0, cardWidth, isMobile ? 40 : 50, 
      { tl: isMobile ? 12 : 16, tr: isMobile ? 12 : 16, bl: 0, br: 0 });
    
    // Название карты
    const cardNameText = card.name || 'Без названия';
    const displayName = cardNameText.length > 20 ? cardNameText.substring(0, 18) + '...' : cardNameText;
    
    const cardName = scene.add.text(0, isMobile ? 20 : 25, displayName, {
      fontFamily: 'Arial, sans-serif',
      fontSize: isMobile ? '16px' : '18px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    
    // Изображение карты (слева)
    const imgSize = isMobile ? 80 : 100;
    const imgX = -cardWidth / 2 + imgSize / 2 + 15; // Сдвигаем влево
    const img = scene.add.image(imgX, isMobile ? 90 : 110, card.image_url)
      .setDisplaySize(imgSize, imgSize * 0.7)
      .setOrigin(0.5);
    
    // Статистика (справа от изображения)
    const statsX = imgX + imgSize / 2 + 20; // Начинаем справа от изображения
    const statsY = isMobile ? 60 : 70;
    
    // Создаем вертикальный список статов
    const createVerticalStat = (icon: string, value: number, yOffset: number,xOffset:number) => {
      const statGroup = scene.add.container(statsX+ xOffset, statsY + yOffset);
      const bg = scene.add.graphics();
      bg.fillStyle(0xeef3ff, 1);
      bg.fillRoundedRect(0, 0, isMobile ? 40 : 50, isMobile ? 25 : 30, 8);
      const text = scene.add.text(
        isMobile ? 20 : 25, 
        isMobile ? 12.5 : 15, 
        `${icon}${value}`, 
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: isMobile ? '12px' : '14px',
          color: '#37474f',
          align: 'center'
        }
      ).setOrigin(0.5);
      
      statGroup.add([bg, text]);
      return statGroup;
    };
    
    // Располагаем статы вертикально
    const healthStat = createVerticalStat('❤️', card.health, 0,0);
    const powerStat = createVerticalStat('⚔️', card.power,0,50);
    const woodStat = createVerticalStat('🌲', card.wood, 0,100);
    const stoneStat = createVerticalStat('🗿', card.stone, 0,150);
    
    // Кнопка покупки (внизу карточки)
    const canAfford = resource.wood >= card.wood && resource.stone >= card.stone;
    const buyBtn = scene.add.graphics();
    const btnWidth = cardWidth * 0.5;
    const btnHeight = isMobile ? 35 : 40;
    const btnX = -btnWidth / 2.7;
    const btnY = cardHeight - btnHeight - 10;
    
    buyBtn.fillStyle(canAfford ? 0x4caf50 : 0x9e9e9e, 1);
    buyBtn.fillRoundedRect(btnX, btnY, btnWidth, btnHeight, 8);
    
    const buyText = scene.add.text(20, btnY + btnHeight / 2, 
      canAfford ? 'Купить' : 'Недостаточно', {
      fontFamily: 'Arial, sans-serif',
      fontSize: isMobile ? '14px' : '16px',
      color: '#ffffff',
      fontStyle: '600',
      align: 'center'
    }).setOrigin(0.5);
    
    // Кликабельная область (вся карточка)
    const clickArea = scene.add.rectangle(0, cardHeight / 2, cardWidth, cardHeight, 0x000000, 0)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    
    // Собираем все элементы карточки
    cardGroup.add([
      cardBg, 
      headerBg, 
      cardName, 
      img, 
      healthStat, 
      powerStat, 
      woodStat, 
      stoneStat,
      buyBtn, 
      buyText, 
      clickArea
    ]);
    
    // Обработчик клика
    clickArea.on('pointerup', () => {
      if (canAfford) {
        resource.wood -= card.wood;
        resource.stone -= card.stone;
        
        // Обновляем ресурсы на сцене
        if ((scene as any).stoneText) (scene as any).stoneText.setText('Камень: ' + resource.stone);
        if ((scene as any).woodText) (scene as any).woodText.setText('Дерево: ' + resource.wood);
        
        setupSocket([{"cell":player.getData("id"),"textures":card.image_url}],HexArr,"Building",scene);
        
        // Переустановить обработчик PointerUp для нового модального окна
        (player as any).removeAllListeners('pointerup');
        (player as any).on('pointerup', (pointer: Phaser.Input.Pointer) => {
          showModal(
            scene,
            units,
            player,
            cards,
            sampleAttacker,
            resource,
            HexArr,
            placeSummon,
            {
              title: 'Юниты',
              card: card.card_id
            }
          );
        });
        
        closeModal();
      }
    });
    
    // Эффект при наведении
    clickArea.on('pointerover', () => {
      scene.tweens.add({
        targets: cardGroup,
        scale: 1.02,
        duration: 150,
        ease: 'Power2'
      });
    });
    
    clickArea.on('pointerout', () => {
      scene.tweens.add({
        targets: cardGroup,
        scale: 1,
        duration: 150,
        ease: 'Power2'
      });
    });
    
    cardContainer.add(cardGroup);
    
    // Увеличиваем Y для следующей карточки
    currentY += cardHeight + cardSpacing;
  });
  
  container.add(cardContainer);
  
  // Добавляем скролл если карточек много
  const totalHeight = currentY; // Общая высота всех карточек
  const maxVisibleHeight = isMobile ? h * 0.7 : h * 0.8;
  
  if (totalHeight > maxVisibleHeight) {
    // Создаем маску для ограничения видимой области
    const mask = scene.add.graphics();
    mask.fillStyle(0xffffff, 1);
    mask.fillRect(
      -container.width / 2, 
      -maxVisibleHeight / 2, 
      container.width, 
      maxVisibleHeight
    );
    cardContainer.setMask(mask.createGeometryMask());

  }
}


// Модаль призыва юнитов (мобильная версия)
export function placeSummon(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  cards: any[],
  scale: number,
  player: Phaser.GameObjects.GameObject,
  closeModal: () => void,
  units: any[],
  sampleAttacker: any[],
  options: ModalOptions,
  resource: ResourceState
): void {
  const w = scene.scale.width;
  const isMobile = w < 768;
  
  const cardContainer = scene.add.container(0, isMobile ? 20 : 30);
  
  // Поиск карт по card_id
  let targetCards: any[] = [];
  cards.forEach((category) => {
    const found = category.filter((card: any) => card.card_id === options.card);
    if (found.length > 0) {
      targetCards = found;
    }
  });
  
  if (targetCards.length === 0) {
    const emptyText = scene.add.text(0, 0, 'Нет доступных юнитов', {
      fontFamily: 'Arial, sans-serif',
      fontSize: isMobile ? '16px' : '18px',
      color: '#666666',
      align: 'center'
    }).setOrigin(0.5);
    container.add(emptyText);
    return;
  }
  
  // Отображение карточек юнитов (адаптивное)
  const cardWidth = isMobile ? Math.min(w * 0.88, 340) : 320;
  const cardHeight = isMobile ? 140 : 220;
  const cardSpacing = isMobile ? 15 : 20;
  
  targetCards.forEach((card: any, index: number) => {
    const y = index * (cardHeight + cardSpacing)-250;
    const cardGroup = scene.add.container(0, y);
    
    // Фон карточки
    const cardBg = scene.add.graphics();
    cardBg.fillStyle(0xffffff, 1);
    cardBg.fillRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, isMobile ? 12 : 16);
    
    // Тень
    cardBg.fillStyle(0x000000, 0.08);
    cardBg.fillRoundedRect(-cardWidth / 2 + 3, 3, cardWidth, cardHeight, isMobile ? 12 : 16);
    
    // Изображение юнита (меньше на мобильных)
    const imgSize = isMobile ? 80 : 180;
    const imgX = -cardWidth / 2 + (isMobile ? 50 : 120);
    const img = scene.add.image(imgX+20, cardHeight / 2, card.image_url)
      .setDisplaySize(imgSize*2, imgSize*2)
      .setOrigin(0.5);
    
    // Информация о юните (компактная для мобильных)
    const infoX = -cardWidth / 2 + (isMobile ? 140 : 320);
    const infoContainer = scene.add.container(infoX, isMobile ? 20 : 30);
    
    const nameText = scene.add.text(20, 0, card.name || 'Без названия', {
      fontFamily: 'Arial, sans-serif',
      fontSize: isMobile ? '16px' : '24px',
      color: '#212529',
      fontStyle: 'bold'
    });
    
    const statsText = scene.add.text(20, isMobile ? 25 : 40, 
      `❤️${card.health} ⚔️${card.power}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: isMobile ? '14px' : '16px',
      color: '#37474f'
    });
    
    const costText = scene.add.text(20+80, isMobile ? 25 : 40, 
      `🌲${card.wood} 🗿${card.stone}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: isMobile ? '14px' : '16px',
      color: '#37474f'
    });
    
    infoContainer.add([nameText, statsText, costText]);
    
    // Кнопки покупки (адаптивные)
    const buttonsY = isMobile ? cardHeight-40 : cardHeight / 2;
    const buttonsContainer = scene.add.container(cardWidth / 2 - (isMobile ? 100 : 180), buttonsY);
    
    const createBuyButton = (text: string, quantity: number, x: number, y: number = 0) => {
      const canAfford = 
      resource.wood >= (card.wood * quantity) 
      && 
      resource.stone >= (card.stone * quantity);
      
      const btnWidth = isMobile ? 70 : 100;
      const btnHeight = isMobile ? 32 : 40;
      
      const buttonBg = scene.add.graphics();
      buttonBg.fillStyle(canAfford ? 0x4caf50 : 0x9e9e9e, 1);
      buttonBg.fillRoundedRect(x, y - btnHeight / 2, btnWidth, btnHeight, 8);
      
      const buttonText = scene.add.text(x + btnWidth / 2, y, text, {
        fontFamily: 'Arial, sans-serif',
        fontSize: isMobile ? '11px' : '14px',
        color: '#ffffff',
        fontStyle: '600',
        align: 'center'
      }).setOrigin(0.5);
      
      const button = scene.add.container(0, 0, [buttonBg, buttonText]);
      button.setInteractive(new Phaser.Geom.Rectangle(x, y - btnHeight / 2, btnWidth, btnHeight), 
        Phaser.Geom.Rectangle.Contains);
      
      if (canAfford) {
        button.on('pointerup', () => {
          const totalWood = card.wood * quantity;
          const totalStone = card.stone * quantity;
          updateTaskCurrent('Армия растёт', quantity);
          resource.wood -= totalWood;
          resource.stone -= totalStone;
          
          // Обновляем ресурсы на сцене
          if ((scene as any).woodText) (scene as any).woodText.setText('Дерево: ' + resource.wood);
          if ((scene as any).stoneText) (scene as any).stoneText.setText('Камень: ' + resource.stone);
          
          // Добавляем юнита в армию
          const existingUnit = sampleAttacker.find((u) => u.name === card.name);
          if (existingUnit) {
            existingUnit.count += quantity;
          } else {
            const newUnit = { ...card, count: quantity };
            sampleAttacker.push(newUnit);
          }
          (window as any).__myUnit=sampleAttacker;
          // Обновляем кнопки если ресурсов стало меньше
          placeSummon(scene, container, cards, scale, player, closeModal, 
            units, sampleAttacker, options, resource);
        });
      }
      
      return button;
    };
    
    if (isMobile) {
      // Для мобильных - кнопки в 2 ряда
      const buy1 = createBuyButton('×1', 1, -75, -15);
      const buy5 = createBuyButton('×5', 5, 0, -15);
      const buy10 = createBuyButton('×10', 10, -75, 15);
      const buy15 = createBuyButton('×15', 15, 0, 15);
      
      buttonsContainer.add([buy1, buy5, buy10, buy15]);
    } else {
      // Для десктопа - горизонтальное расположение
      const buy1 = createBuyButton('Купить 1', 1, -150);
      const buy5 = createBuyButton('Купить 5', 5, -30);
      const buy10 = createBuyButton('Купить 10', 10, 90);
      
      buttonsContainer.add([buy1, buy5, buy10]);
    }
    
    cardGroup.add([cardBg, img, infoContainer, buttonsContainer]);
    cardContainer.add(cardGroup);
  });
  
  container.add(cardContainer);
}

// Информация по юниту (мобильная версия)
export function showUnitInfoModal(scene: Phaser.Scene, card: CardInfo): void {
  const w = scene.scale.width;
  const h = scene.scale.height;
  const isMobile = w < 768;
  
  const boxW = isMobile ? w * 0.85 : 400;
  const boxH = isMobile ? h * 0.7 : 500;
  
  // Полупрозрачный фон
  const bg = scene.add.rectangle(0, 0, w, h, 0x000000, 0.5)
    .setOrigin(0)
    .setDepth(9000)
    .setInteractive();
  
  // Контейнер для модального окна
  const container = scene.add.container(w / 2, h / 2).setDepth(10000);
  container.alpha = 0;
  container.scale = 0.9;
  
  // Фон модалки
  const box = scene.add.graphics();
  const radius = isMobile ? 20 : 24;
  box.fillStyle(0x212529, 1);
  box.fillRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, radius);
  
  // Заголовок с градиентом
  const titleBg = scene.add.graphics();
  titleBg.fillStyle(0x6d9cff, 1);
  titleBg.fillRoundedRect(-boxW / 2, -boxH / 2, boxW, isMobile ? 60 : 80, 
    { tl: radius, tr: radius, bl: 0, br: 0 });
  
  const titleText = scene.add.text(0, -boxH / 2 + (isMobile ? 30 : 40), 
    card.name || 'Юнит', {
    fontFamily: 'Arial, sans-serif',
    fontSize: isMobile ? '22px' : '28px',
    color: '#ffffff',
    fontStyle: 'bold',
    align: 'center'
  }).setOrigin(0.5);
  
  // Изображение юнита
  const imgSize = isMobile ? 120 : 200;
  const img = scene.add.image(0, -boxH / 2 + (isMobile ? 110 : 140), card.image_url)
    .setDisplaySize(imgSize, imgSize)
    .setOrigin(0.5);
  
  // Статистика (вертикальный список для мобильных)
  const statsContainer = scene.add.container(0, -boxH / 2 + (isMobile ? 220 : 300));
  
  const createStatItem = (icon: string, label: string, value: string, y: number) => {
    const container = scene.add.container(0, y);
    
    const iconX = isMobile ? -boxW / 2 + 30 : -150;
    const labelX = isMobile ? -boxW / 2 + 70 : -120;
    const valueX = isMobile ? boxW / 2 - 30 : 150;
    
    const iconText = scene.add.text(iconX, 0, icon, {
      fontFamily: 'Arial',
      fontSize: isMobile ? '18px' : '20px'
    });
    
    const labelText = scene.add.text(labelX, 0, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: isMobile ? '16px' : '16px',
      color: '#37474f'
    });
    
    const valueText = scene.add.text(valueX, 0, value, {
      fontFamily: 'Arial, sans-serif',
      fontSize: isMobile ? '18px' : '18px',
      color: '#212529',
      fontStyle: 'bold'
    }).setOrigin(isMobile ? 1 : 1, 0.5);
    
    container.add([iconText, labelText, valueText]);
    return container;
  };
  
  const statSpacing = isMobile ? 35 : 40;
  const healthStat = createStatItem('❤️', 'Здоровье:', card.health.toString(), 0);
  const powerStat = createStatItem('⚔️', 'Сила:', card.power.toString(), statSpacing);
  const woodStat = createStatItem('🌲', 'Дерево:', card.wood.toString(), statSpacing * 2);
  const stoneStat = createStatItem('🗿', 'Камень:', card.stone.toString(), statSpacing * 3);
  
  statsContainer.add([healthStat, powerStat, woodStat, stoneStat]);
  
  container.add([box, titleBg, titleText, img, statsContainer]);
  
  // Анимация появления
  scene.tweens.add({
    targets: container,
    alpha: 1,
    scale: 1,
    duration: 250,
    ease: 'Power2'
  });
  
  // Закрытие по клику на фон или по самой модалке
  const closeModalFunc = () => {
    scene.tweens.add({
      targets: container,
      alpha: 0,
      scale: 0.9,
      duration: 200,
      onComplete: () => {
        container.destroy();
        bg.destroy();
      }
    });
  };
  
  bg.on('pointerup', closeModalFunc);
  
  // мобильных - закрытие по клику в любом месте модалки
  container.setInteractive(
    new Phaser.Geom.Rectangle(-boxW / 2, -boxH / 2, boxW, boxH),
    Phaser.Geom.Rectangle.Contains
  );
  
  container.on('pointerup', closeModalFunc);
}

export function showAttachedUnitsModal(
  hexData:HexArrType,
  scene: Phaser.Scene,
  attachedUnits: any[],
  options: ModalOptions = {},
  targetObject: Phaser.GameObjects.GameObject,
): void {
  const w = scene.scale.width;
  const h = scene.scale.height;
  const isMobile = w < 768;

  const boxW = isMobile ?   350: w * 0.9;
  const boxH = isMobile ?  530: h * 0.9;

  // Фон затемнения
  const bg = scene.add.rectangle(0, 0, w, h, 0x000000, 0.5)
    .setOrigin(0)
    .setDepth(9000)
    .setInteractive();

  const container = scene.add.container(w / 2, h / 2).setDepth(10000);
  container.alpha = 0;
  container.scale = 0.9;

  const panel = scene.add.graphics();
  const radius = isMobile ? 20 : 24;
  panel.fillStyle(0xffffff, 1);
  panel.fillRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, radius);

  const title = scene.add.text(0, -boxH / 2 + (isMobile ? 20 : 26), 'Прикреплённые юниты', {
    fontFamily: 'Arial, sans-serif',
    fontSize: isMobile ? '18px' : '20px',
    color: '#ffffff',
    align: 'center'
  }).setOrigin(0.5);
  const titleBg = scene.add.graphics();
  titleBg.fillStyle(0x6d9cff, 1);
  titleBg.fillRoundedRect(-boxW / 2, -boxH / 2, boxW, isMobile ? 50 : 60, 
    { tl: radius, tr: radius, bl: 0, br: 0 });
  // Список юнитов
  const contentYStart = -boxH / 2 + (isMobile ? 60 : 70);
  const entryHeight = isMobile ? 40 : 46;
  let currentY = contentYStart;
  const listContainer = scene.add.container(0, 20);

  attachedUnits.forEach((unit, index) => {
    const row = scene.add.container(0, currentY);
    const rowBg = scene.add.rectangle(-boxW / 2 + 8, 0, boxW - 16, entryHeight - 6, 0xf9fbff)
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true }); // Делаем фон интерактивным

    const nameText = scene.add.text(-boxW / 2 + 20, 0, unit.name ?? 'Юнит', {
      fontFamily: 'Arial, sans-serif',
      fontSize: isMobile ? '14px' : '16px',
      color: '#333'
    }).setOrigin(0, 0.5);

    // Количество
    const count = unit.count ?? 1;
    const countText = scene.add.text(boxW / 2 - 60, 0, `x${count}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: isMobile ? '14px' : '16px',
      color: '#333'
    }).setOrigin(0.5);

    // Plus кнопка для увеличения
    const plusBtn = scene.add.text(boxW / 2 - 20, 0, '+', {
      fontFamily: 'Arial',
      fontSize: isMobile ? '18px' : '20px',
      color: '#0d6efd'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    row.add([rowBg, nameText, countText, plusBtn]);
    listContainer.add(row);

    rowBg.on('pointerup', () => {
        unit.count = unit.count === undefined ? 1 : (unit.count -1);
        countText.setText(`x${unit.count}`);
        const isAdd=(targetObject as any).units?.filter((elem:any)=>elem.name==unit.name)
        if(!isAdd || isAdd.length==0){
          isAdd?(targetObject as any).units.push({...unit}):(targetObject as any).units=[{...unit}];
          (targetObject as any).units.forEach((elem:any)=>elem.name==unit.name?elem.count=1:null)
        }
        else{
          (targetObject as any).units.forEach((elem:any)=>elem.name==unit.name?elem.count++:null)
        };
        if(unit.count<=0){
          attachedUnits.splice(index,1);
          row.destroy();
        }
        (window as any).__myUnit=attachedUnits;
    });
    currentY += entryHeight;

  });
  container.add([panel, titleBg,title, listContainer]);

  // Закрытие по клику на фон
  bg.on('pointerup', () => {
    closeModal();
  });

  // Анимация появления
  scene.tweens.add({
    targets: container,
    alpha: 1,
    scale: 1,
    ease: 'Power2',
    duration: 200
  });

  function closeModal() {
    scene.tweens.add({
      targets: container,
      alpha: 0,
      scale: 0.9,
      ease: 'Power2',
      duration: 200,
      onComplete: () => {
        container.destroy();
        bg.destroy();
        showAttachUnitsLauncher(hexData,scene,targetObject, attachedUnits,options)
      }
    });
  }
}



export function showAttachUnitsLauncher(
  hexData:HexArrType,
  scene: Phaser.Scene,
  targetObject: Phaser.GameObjects.GameObject, 
  attachedUnits: any[],
  options: ModalOptions = {}
): void {
   const w = scene.scale.width;
  const h = scene.scale.height;
  const isMobile = w < 768;

  const boxW = isMobile ?   350: w * 0.9;
  const boxH = isMobile ?  530: h * 0.9;

  const container = scene.add.container(w / 2, h / 2).setDepth(10000);
  container.alpha = 0;
  container.scale = 0.9;

  const panel = scene.add.graphics();
  const radius = isMobile ? 20 : 24;
  panel.fillStyle(0xffffff, 1);
  panel.fillRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, radius);

  const title = scene.add.text(0, -boxH / 2 + (isMobile ? 20 : 26), 'Прикреплённые юниты', {
    fontFamily: 'Arial, sans-serif',
    fontSize: isMobile ? '18px' : '20px',
    color: '#ffffff',
    align: 'center'
  }).setOrigin(0.5);
  const titleBg = scene.add.graphics();
  titleBg.fillStyle(0x6d9cff, 1);
  titleBg.fillRoundedRect(-boxW / 2, -boxH / 2, boxW, isMobile ? 50 : 60, 
    { tl: radius, tr: radius, bl: 0, br: 0 });
  // Список юнитов
  const contentYStart = -boxH / 2 + (isMobile ? 60 : 70);
  const entryHeight = isMobile ? 40 : 46;
  let currentY = contentYStart;
  const listContainer = scene.add.container(0, 20);
  if((targetObject as any).units){
  (targetObject as any).units.forEach((unit:any, index:number) => {
    const row = scene.add.container(0, currentY);
    const rowBg = scene.add.rectangle(-boxW / 2 + 8, 0, boxW - 16, entryHeight - 6, 0xf9fbff)
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true }); // Делаем фон интерактивным

    const nameText = scene.add.text(-boxW / 2 + 20, 0, unit.name ?? 'Юнит', {
      fontFamily: 'Arial, sans-serif',
      fontSize: isMobile ? '14px' : '16px',
      color: '#333'
    }).setOrigin(0, 0.5);

    // Количество
    const count = unit.count ?? 1;
    const countText = scene.add.text(boxW / 2 - 60, 0, `x${count}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: isMobile ? '14px' : '16px',
      color: '#333'
    }).setOrigin(0.5);

    row.add([rowBg, nameText, countText]);

    rowBg.on('pointerup', () => {
        unit.count = unit.count === undefined ? 1 : (unit.count - 1);
        console.log(unit);
        countText.setText(`x${unit.count}`);
        const isAdd= ((attachedUnits as any))?.filter((elem:any)=>elem.name==unit.name)
        if(!isAdd || isAdd.length==0){
          isAdd?(attachedUnits as any).push({...unit}):(attachedUnits as any)=[{...unit}];
          (attachedUnits as any).forEach((elem:any)=>elem.name==unit.name?elem.count=1:null)
        }
        else{
           (attachedUnits as any).forEach((elem:any)=>elem.name==unit.name?elem.count++:null)
        };
      if(unit.count<=0){
        (targetObject as any).units.splice(index,1);
        console.log((targetObject as any).units);
        row.destroy();
      }
      (window as any).__myUnit=attachedUnits;
    });
    listContainer.add(row);
    currentY += entryHeight;

  });
  }
  else{
    const noText = scene.add.text(0, -boxH / 2 + (isMobile ? 60 : 70), `Пока что тут нет юнитов`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: isMobile ? '14px' : '16px',
      color: '#333'
    }).setOrigin(0.5);
    listContainer.add(noText);
  }
  container.add([panel, titleBg,title, listContainer]);

  const btnSize = isMobile ? 40 : 46;
  const panelW = isMobile ? 80 : 120;
  const panelH = isMobile ? 60 : 60;

  const overlay = scene.add.rectangle(0, 0, w, h, 0x000000, 0.4)
    .setOrigin(0)
    .setDepth(9000)
    .setInteractive();

  const plusCircle = scene.add.circle(0, boxH / 3.5 + (isMobile ? 60 : 70), btnSize, 0x6d9cff).setOrigin(0.5);
  const plusText = scene.add.text(0, boxH / 3.5 + (isMobile ? 60 : 70), '+', {
    fontFamily: 'Arial',
    fontSize: isMobile ? '20px' : '22px',
    color: '#fff'
  }).setOrigin(0.5);

  const plusContainer = scene.add.container(0, 0, [plusCircle, plusText]);

  container.add([panel, plusContainer]);

  plusCircle.setInteractive({ useHandCursor: true });
  plusCircle.on('pointerup', () => {
    showAttachedUnitsModal(hexData,scene, attachedUnits, options, targetObject);
    scene.tweens.add({
      targets: container,
      alpha: 0,
      scale: 0.9,
      ease: 'Power2',
      duration: 200,
      onComplete: () => {
        container.destroy();
        overlay.destroy();
      }
    });
  });

  overlay.setInteractive();
  overlay.on('pointerup', () => {
    scene.tweens.add({
      targets: container,
      alpha: 0,
      scale: 0.9,
      ease: 'Power2',
      duration: 200,
      onComplete: () => {
        container.destroy();
        overlay.destroy();
        setupSocket((targetObject as any).units,hexData, "setHeartUnits", scene);
      }
    });
  });

  scene.tweens.add({
    targets: container,
    alpha: 1,
    scale: 1,
    duration: 200,
    ease: 'Back.Out'
  });
}

