<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="white-toolbar">
        <ion-title class="page-main-title">Начало матча</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" color="primary" class="task-btn-header" @click="openDailyTasks">
            🎯 Задания
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="create-deck-content">
      <!-- Главная светлая карточка лобби -->
      <div class="lobby-wrapper">
        <ion-card class="white-card matchmaking-box">
          <div class="lobby-icon-zone">
            <div class="swords-circle" :class="{ 'pulse-searching': isConnecting || isConnected }">
              ⚔️
            </div>
          </div>
          
          <ion-card-header class="text-center">
            <ion-card-title class="lobby-title">Арена битв</ion-card-title>
            <ion-card-subtitle class="lobby-subtitle">Готовы к новому сражению?</ion-card-subtitle>
          </ion-card-header>

          <ion-card-content>
            <ion-button 
              @click="startMatch" 
              expand="block"
              color="primary"
              :disabled="isConnecting"
              class="action-submit-btn"
            >
              {{ isConnected ? 'В очереди...' : isConnecting ? 'Подключение...' : 'Найти соперника' }}
            </ion-button>
            
            <!-- Статус подключения -->
            <div v-if="statusMessage" class="status-pill" :class="{ 'connected-pill': isConnected }">
              <span class="status-dot" v-if="isConnecting || isConnected"></span>
              {{ statusMessage }}
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Модальное окно выбора колоды (Светлый BottomSheet) -->
      <ion-modal 
        :is-open="showDeckChoiceModal" 
        :initial-breakpoint="0.6" 
        :breakpoints="[0, 0.6, 0.95]"
        :handle="true"
        @didDismiss="closeDeckChoice"
      >
        <ion-header class="ion-no-border">
          <ion-toolbar class="white-toolbar text-center border-b">
            <ion-title class="modal-inside-title">Выберите колоду</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content class="light-modal-content ion-padding-horizontal">
          <div class="decks-grid-layout">
            <div
              v-for="deck in decks" 
              :key="deck.id" 
              class="light-deck-card"
              @click="() => selectDeck(deck.id)"
            >
              <div class="deck-img-container">
                <img
                  v-if="deck.card_id1_details?.image_url"
                  :src="'http://localhost:3000/images/' + deck.card_id1_details.image_url + '.png'"
                  alt="Обложка карты"
                  class="deck-inner-img"
                />
                <div v-else class="deck-inner-img placeholder-box">🃏</div>
              </div>
              <div class="deck-info-block">
                <h3>{{ deck.name }}</h3>
                <span class="select-text">Выбрать ⚡</span>
              </div>
            </div>
          </div>
        </ion-content>
      </ion-modal>

      <!-- Модальное окно ежедневных заданий -->
      <ion-modal 
        :is-open="showDailyTasksModal" 
        :initial-breakpoint="0.5" 
        :breakpoints="[0, 0.5, 0.85]"
        :handle="true"
        @didDismiss="closeDailyTasks"
      >
        <ion-header class="ion-no-border">
          <ion-toolbar class="white-toolbar text-center border-b">
            <ion-title class="modal-inside-title">Ежедневные квесты</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content class="light-modal-content ion-padding">
          <div class="clean-tasks-list">
            <div v-for="task in dailyTasks" :key="task.id" class="clean-task-row">
              <div class="task-left-part">
                <div class="task-avatar-icon">{{ task.icon }}</div>
                <div class="task-text-data">
                  <h4>{{ task.title }}</h4>
                  <p>{{ task.desc }}</p>
                </div>
              </div>
              <div class="task-right-part">
                <div class="mini-progress-bg">
                  <div class="mini-progress-fill" :style="{ width: (task.current / task.target * 100) + '%' }"></div>
                </div>
                <span class="mini-progress-digits">{{ task.current }}/{{ task.target }}</span>
              </div>
            </div>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onBeforeUnmount, onMounted } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButton, IonButtons, IonModal, IonCard, IonCardHeader, 
  IonCardSubtitle, IonCardTitle, IonCardContent 
} from '@ionic/vue';
import { apiFetch } from '@/utilit/fetchUtils.ts';
import { useRouter } from 'vue-router';

const router = useRouter();
let socketMatch = null;
const isConnected = ref(false);
const isConnecting = ref(false);
const selectedDeckId = ref(null); 
const showDeckChoiceModal = ref(false);
const allCards = ref([]);
const showDailyTasksModal = ref(false);
const decks = ref([]);
const statusMessage = ref('');
const dailyTasks = ref([]);

function initDailyTasks() {
  const today = new Date().toDateString();
  const savedDate = localStorage.getItem('tasks_date');
  const savedTasks = localStorage.getItem('daily_tasks');
  //localStorage.setItem('tasks_date', new Date(Date.now() - 86400000).toDateString());
  if (savedDate === today && savedTasks) {
    dailyTasks.value = JSON.parse(savedTasks);
  } else {
    const taskPool = [
  { id: 1, title: 'Первый шаг', desc: 'Сделайте 1 перемещение юнитом', target: 1, current: 0, icon: '🚶' },
  { id: 2, title: 'Захватчик', desc: 'Захватите 3 клетки', target: 3, current: 0, icon: '🏳️' },
  { id: 3, title: 'Добытчик', desc: 'захватите 3 клетки с деревом', target: 3, current: 0, icon: '🪵' },
    { id: 3, title: 'Шахтёр', desc: 'захватите 3 клетки с камнем', target: 3, current: 0, icon: '🪨' },
  { id: 5, title: 'Боец', desc: 'Выиграйте 1 бой', target: 1, current: 0, icon: '⚔️' },
  { id: 6, title: 'Разрушитель', desc: 'Уничтожьте 5 вражеских единиц земли', target: 5, current: 0, icon: '💥' },
  { id: 7, title: 'Экспансия', desc: 'Захватите 1 ресурсную клетку', target: 1, current: 0, icon: '🌲' },
  { id: 8, title: 'Армия растёт', desc: 'Соберите или призовите 5 юнитов', target: 5, current: 0, icon: '🧑‍✈️' },
  { id: 9, title: 'Стратег', desc: 'Сделайте 10 перемещений', target: 10, current: 0, icon: '🧠' },
  { id: 10, title: 'Победитель', desc: 'Выиграйте 2 матча', target: 2, current: 0, icon: '🏆' }
];
    const shuffled = taskPool.sort(() => 0.5 - Math.random());
    const selectedTasks = shuffled.slice(0, 3);
    localStorage.setItem('tasks_date', today);
    localStorage.setItem('daily_tasks', JSON.stringify(selectedTasks));
    dailyTasks.value = selectedTasks;
  }
}

function openDailyTasks() {
  initDailyTasks();
  showDailyTasksModal.value = true;
}

function closeDailyTasks() { showDailyTasksModal.value = false; }

function setupSocket() {
  if (socketMatch) { socketMatch.close(); socketMatch = null; }
  socketMatch = new WebSocket('http://localhost:3000');
  socketMatch.onopen = () => {
    isConnecting.value = false;
    isConnected.value = true;
    statusMessage.value = 'В очереди поиска противника...';
    socketMatch.send(JSON.stringify({ type: 'find_match', id: localStorage.getItem("auth") }));
  };
  socketMatch.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'waiting') {
        statusMessage.value = 'Ожидание соперника...';
      } else if (data.type === 'match_start') {
        socketMatch.close();
        socketMatch = null;
        statusMessage.value = `Игрок найден: ${data.opponent}`;
        router.push('/tabs/game');
      } else if (data.error) {
        statusMessage.value = `Ошибка: ${data.error}`;
        isConnected.value = false;
      }
    } catch {
      statusMessage.value = 'Некорректный ответ сервера.';
    }
  };
  socketMatch.onerror = () => {
    statusMessage.value = 'Ошибка соединения.';
    isConnected.value = false;
    isConnecting.value = false;
  };
  socketMatch.onclose = () => {
    isConnected.value = false;
    isConnecting.value = false;
  };
}

async function startMatch() {
  if (!showDeckChoiceModal.value && !selectedDeckId.value) {
    openDeckChoice();
  } else if (selectedDeckId.value) {
    closeDeckChoice();
    if (!isConnected.value && !isConnecting.value) {
      isConnecting.value = true;
      statusMessage.value = 'Подключение к серверу...';
      setupSocket();
    }
  }
}

function openDeckChoice() { showDeckChoiceModal.value = true; }
const closeDeckChoice = () => { showDeckChoiceModal.value = false; };

function selectDeck(deckId) {
  selectedDeckId.value = deckId;
  localStorage.setItem("DeckID", selectedDeckId.value);
  startMatch();
}

const fetchCollections = async () => {
  try {
    const response = await apiFetch('http://localhost:3000/api/getPlayerDecs', {
      method: 'POST',
      body: JSON.stringify({ id: localStorage.getItem('auth') }),
    });
    const response2 = await apiFetch('http://localhost:3000/api/getPlayerCollections', {
      method: 'POST',
      body: JSON.stringify({ id: localStorage.getItem('auth') }),
    });
    allCards.value = response2 || [];
    if(response && response.length > 0) {
      decks.value = mergeCards(response, response2);
    }
  } catch (error) {
    console.error('Ошибка загрузки колод:', error);
  }
}

function mergeCards(decksArray, cardsArray) {
  const cardsMap = {};
  cardsArray.forEach(card => {
    cardsMap[card.id] = card;
  });

  return decksArray.map(deck => {
    ['card_id1', 'card_id2', 'card_id3'].forEach(field => {
      const cardId = deck[field];
      if (cardId && cardsMap[cardId]) {
        deck[field + '_details'] = cardsMap[cardId];
      }
    });
    return deck;
  });
}


onMounted(async () => {
  initDailyTasks();
  await fetchCollections();
});

onBeforeUnmount(() => {
  if (socketMatch) { socketMatch.close(); }
});
</script>

<style scoped>
.create-deck-content {
  --ion-background-color: #f8f9fa;
  background-color: #f8f9fa;
}

.white-toolbar {
  --background: #ffffff;
  --color: #2d3748;
  padding: 2px 4px;
}
.page-main-title {
  font-weight: 700;
  font-size: 19px;
  letter-spacing: -0.3px;
}
.task-btn-header {
  font-weight: 600;
  font-size: 14px;
}

.lobby-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 75vh;
  padding: 16px;
}
.matchmaking-box {
  background: #ffffff !important;
  border-radius: 20px;
  padding: 24px 16px;
  margin: 0;
  width: 100%;
  max-width: 340px;
  box-shadow: 0 10px 25px rgba(160, 174, 192, 0.15) !important;
  border: 1px solid #edf2f7;
}

/* Анимированная зона иконки */
.lobby-icon-zone {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}
.swords-circle {
  width: 80px;
  height: 80px;
  background: #edf2f7;
  border-radius: 50%;
  font-size: 32px;
  line-height: 80px;
  text-align: center;
}
.pulse-searching {
  animation: lightPulse 1.6s infinite ease-in-out;
  background: #ebf8ff;
  border: 2px solid #3182ce;
}
@keyframes lightPulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(49, 130, 206, 0.2); }
  50% { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(49, 130, 206, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(49, 130, 206, 0); }
}

.lobby-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a202c;
}
.lobby-subtitle {
  font-size: 13px;
  color: #718096;
  margin-top: 4px;
}

.action-submit-btn {
  --border-radius: 12px;
  --box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
  font-weight: 600;
  height: 48px;
  margin-top: 12px;
}

/* Статус-бар внизу */
.status-pill {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  color: #4a5568;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 12px;
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.connected-pill {
  background: #f0fff4;
  border-color: #c6f6d5;
  color: #22543d;
}
.status-dot {
  width: 6px;
  height: 6px;
  background: #38a169;
  border-radius: 50%;
  animation: blinker 1.2s infinite;
}
@keyframes blinker { 50% { opacity: 0; } }

/* Сетка выбора колод (BottomSheet) */
.light-modal-content {
  --background: #f8f9fa;
}
.modal-inside-title {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
}
.decks-grid-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 16px 0;
}
.light-deck-card {
  background: #ffffff;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
}
.light-deck-card:active {
  transform: scale(0.97);
}
.deck-img-container {
  position: relative;
  padding-top: 85%;
  background: #edf2f7;
}
.deck-inner-img {
  position: absolute;
  top:0; left:0; width:100%; height:100%;
  object-fit: cover;
}
.placeholder-box {
  display: flex; align-items: center; justify-content: center; font-size: 24px;
}
.deck-info-block {
  padding: 10px;
  text-align: center;
}
.deck-info-block h3 {
  margin: 0 0 2px 0; font-size: 13px; font-weight: 600; color: #2d3748;
}
.select-text {
  font-size: 11px; color: #3182ce; font-weight: 500;
}

/* Ежедневные задания */
.clean-tasks-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.clean-task-row {
  background: #ffffff;
  border: 1px solid #edf2f7;
  border-radius: 14px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.task-left-part {
  display: flex;
  gap: 12px;
  align-items: center;
}
.task-avatar-icon {
  width: 38px;
  height: 38px;
  background: #f7fafc;
  border-radius: 10px;
  font-size: 20px;
  line-height: 38px;
  text-align: center;
  border: 1px solid #e2e8f0;
}
.task-text-data h4 {
  margin: 0 0 2px 0; font-size: 14px; font-weight: 600; color: #2d3748;
}
.task-text-data p {
  margin: 0; font-size: 11px; color: #718096;
}
.task-right-part {
  display: flex;
  align-items: center;
  gap: 10px;
}
.mini-progress-bg {
  background: #edf2f7;
  height: 6px;
  border-radius: 3px;
  flex-grow: 1;
  overflow: hidden;
}
.mini-progress-fill {
  background: #3182ce;
  height: 100%;
  border-radius: 3px;
}
.mini-progress-digits {
  font-size: 11px; font-weight: 600; color: #4a5568; min-width: 32px; text-align: right;
}

.border-b {
  border-b: 1px solid #edf2f7;
}
.text-center { text-align: center; }
</style>
