<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Коллекция</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen class="shop-content">
      <!-- Поиск -->
      <ion-searchbar
        v-model="query"
        placeholder="Поиск карт..."
        class="search-bar"
      ></ion-searchbar>
      <ion-button
        expand="block"
        color="primary"
        style="margin: 12px 16px;"
        @click="goToCreateDeck"
      >
      Колоды
      </ion-button>
      <!-- Коллекция карт -->
      <ion-grid fixed class="cards-grid">
        <ion-row justify-content-center>
          <ion-col
            v-for="card in filteredCards"
            :key="card.id"
            size="12"
            size-sm="6"
            size-md="4"
          >
            <ion-card class="card-card" @click="showCardDetails(card)">
              <template v-if="card.image_url">
                <img :src="'http://localhost:3000/images/'+card.image_url+'.png'" alt="Обложка карты" class="card-cover" />
              </template>
              <template v-else>
                <div class="card-cover placeholder"></div>
              </template>

              <ion-card-header class="card-header">
                <ion-card-title class="card-title">{{ card.name }}</ion-card-title>
                <span v-if="card.rarity" class="card-rarity">{{ card.rarity }}👛</span>
              </ion-card-header>

              <ion-card-content class="card-content">
                <div class="card-meta">
                  <div>тип: <strong>{{ card.type }}</strong></div>
                  <div>сила: <span class="power">{{ card.power }}</span></div>
                  <div>жизнь: <span class="health">{{ card.health }}</span></div>
                </div>

                <div class="card-stats">
                  <span class="stat-chip">камень: {{ card.stone }}</span>
                  <span class="stat-chip">дерево: {{ card.wood }}</span>
                </div>
              </ion-card-content>

              <ion-item lines="none" class="card-actions">

                <!-- Новая кнопка: вывод юнитов текущей карты -->
                <ion-button fill="outline" color="success" slot="end" @click.stop="openUnitsFor(card)">
                  юниты
                </ion-button>
              </ion-item>
            </ion-card>
          </ion-col>
        </ion-row>

        <ion-row v-if="filteredCards.length === 0" justify-content="center">
          <ion-col size="12" class="empty-state">
            Нет карт, соответствующих запросу.
          </ion-col>
        </ion-row>
      </ion-grid>

<!-- Модальное окно с юнитами выбранной карты -->
<ion-modal 
  :is-open="showUnitsModal" 
  :initial-breakpoint="0.55" 
  :breakpoints="[0, 0.55, 0.85]"
  :handle="true"
  @didDismiss="closeUnitsModal"
  class="glass-modal"
>
  <ion-header class="ion-no-border">
    <ion-toolbar class="glass-toolbar">
      <ion-title class="modal-title">Юниты карты</ion-title>
      <ion-buttons slot="end">
        <ion-button id="close-btn" @click="closeUnitsModal">Закрыть</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>

  <ion-content class="glass-content">
    <div v-if="previewUnits.length === 0" class="no-units">
      Юниты для выбранной карты не найдены.
    </div>

    <ion-list v-else lines="none" class="glass-list">
      <ion-item v-for="u in previewUnits" :key="u.id" class="glass-item">
        <ion-avatar v-if="u.image_url" slot="start" class="unit-avatar">
          <img :src="'http://localhost:3000/images/' + u.image_url + '.png'" alt="Юнит" />
        </ion-avatar>
        <ion-avatar v-else slot="start" class="unit-avatar placeholder">
          <span>⚔️</span>
        </ion-avatar>

        <ion-label class="unit-info">
          <h3 class="unit-name">{{ u.name }}</h3>
          <div class="unit-stats-row">
            <span class="stat-badge hp">❤️ {{ u.health }}</span>
            <span class="stat-badge pwr">⚔️ {{ u.power }}</span>
            <span class="stat-badge rng">🎯 {{ u.range }}</span>
          </div>
        </ion-label>
      </ion-item>
    </ion-list>
  </ion-content>
</ion-modal>

      <IonToast 
      :is-open="toast.open"
      :message="toast.message"
      position="bottom" 
      duration="500"
      color="primary"></IonToast>
    </ion-content>
  </ion-page>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonButton, IonImg, IonSearchbar, IonToast, IonButtons, IonMenuButton, IonIcon, IonList, IonAvatar,
  onIonViewWillEnter
} from '@ionic/vue';
import { apiFetch } from '@/utilit/fetchUtils.ts';

import {getFiles} from '@/views/Battle/onMount';

import { useRouter } from 'vue-router';

const router = useRouter();

const goToCreateDeck = () => {
  router.push('/tabs/create-deck');
};

const cards = ref([]);
const query = ref('');
const toast = ref({ open: false, message: '' });
const units = ref([]); 

const selectedCardId = ref(null);
const showUnitsModal = ref(false);

const assets = [

];


const flattenUnits = (arr) => {
  const res = [];
  const walk = (a) => {
    if (!a) return;
    if (Array.isArray(a)) {
      for (const v of a) walk(v);
    } else {
      res.push(a);
    }
  };
  walk(arr);
  return res;
};

const getCollections = async () => {
  try {
    const response = await apiFetch('http://localhost:3000/api/getPlayerCollections',
    {
      method: 'POST',
      body: JSON.stringify({id: localStorage.getItem("auth")})
    });
    cards.value = response || [];
  } catch (error) {
    console.error('Ошибка загрузки коллекций:', error);
  }
};

const getUnits = async () => {
  try {
    const unitResponses = await Promise.all(
      cards.value.map((elem) =>
        apiFetch('http://localhost:3000/api/getUnit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ card: elem.id })
        })
      ),
    );
    const enrichedLists = unitResponses;
    units.value = flattenUnits(enrichedLists);
  } catch (error) {
    console.error('Ошибка при сохранении профиля:', error);
  }
};



const previewUnits = computed(() => {
  const cid = selectedCardId.value;
  if (!cid) return [];
  const cidVal = typeof cid === 'object' ? (cid.card_id ?? cid.id) : cid;
  const flat = flattenUnits(units.value);
  return flat.filter((u) => u && u.card_id === cidVal);
});

// открыть модальное окно
const openUnitsFor = (card) => {
  selectedCardId.value = card.card_id ?? card.id;
  showUnitsModal.value = true;
};

// закрыть модальное окно
const closeUnitsModal = () => {
  showUnitsModal.value = false;
  selectedCardId.value = null;
};

onMounted(async() => {
  await getCollections();
  await getUnits();
  await getFiles(assets, apiFetch);
});

onIonViewWillEnter(async () => {
  await getCollections();
  await getUnits();
});

const showCardDetails = (card) => {
  console.log('Просмотр деталей карты:', card);
};


const filteredCards = computed(() => {
  if (!query.value) return cards.value;
  const q = query.value.toLowerCase();
  return cards.value.filter(
    (c) =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.type || '').toLowerCase().includes(q) ||
      (c.rarity || '').toString().toLowerCase().includes(q)
  );
});

</script>

<style scoped>
#close{
  --background: #f3f6ff;
  --color: #4b5fa7;
  border-radius: 12px;
}

/* ===== HEADER ===== */

ion-toolbar {
  --background: rgba(255,255,255,.82);

  backdrop-filter: blur(14px);

  border-bottom:
    1px solid rgba(120,140,255,.08);
}

ion-title {
  font-weight: 800;
  letter-spacing: .4px;

  color: #32415f;
}

/* ===== MODAL ===== */

ion-modal {
  --height: 55%;
  --width: 100%;
  --border-radius: 28px 28px 0 0;

  align-items: flex-end;

  backdrop-filter: blur(12px);
}

ion-modal ion-content{
  --background:
    linear-gradient(
      180deg,
      rgba(248,250,255,.96),
      rgba(235,241,255,.94)
    );

  backdrop-filter: blur(18px);
}

ion-modal ion-toolbar{
  --background:
    rgba(20,26,38,.92);

  color: white;

  border-bottom:
    1px solid rgba(255,255,255,.06);
}
ion-modal ion-toolbar{
  --background:
    rgba(20,26,38,.92);

  color: white;

  border-bottom:
    1px solid rgba(255,255,255,.06);
}
ion-title{
  color: white ;

  font-weight: 700;
}
/* ===== BACKGROUND ===== */

.shop-content {
  --ion-background-color: #eef3ff;

  background:
    radial-gradient(circle at top left, rgba(109,156,255,.18), transparent 25%),
    radial-gradient(circle at bottom right, rgba(72, 92, 255, 0.12), transparent 25%),
    linear-gradient(135deg, #f5f7ff 0%, #e9eefb 100%);

  min-height: 120%;

  padding-bottom: env(safe-area-inset-bottom);
}

/* ===== SEARCH ===== */

.search-bar {
  margin: 14px;

  border-radius: 18px;

  --background: rgba(255,255,255,0.75);

  --box-shadow:
    0 8px 20px rgba(70,90,140,.08);

  backdrop-filter: blur(10px);
}

ion-searchbar{
  color:#444 !important;
}

/* ===== BUTTON ===== */

.deck-btn{
  margin: 14px 16px;

  --background:
    linear-gradient(
      135deg,
      #6d9cff,
      #4a7bd8
    );

  --border-radius: 18px;

  height: 48px;

  font-weight: 700;

  box-shadow:
    0 10px 24px rgba(74,123,216,.25);
}

/* ===== GRID ===== */

.cards-grid {
  padding: 12px;
}

/* ===== CARD ===== */

.card-card {
  position: relative;

  border-radius: 24px;

  overflow: hidden;

  background: rgba(255,255,255,0.82);

  backdrop-filter: blur(14px);

  border: 1px solid rgba(255,255,255,.5);

  box-shadow:
    0 10px 30px rgba(40,60,120,.10),
    inset 0 1px 0 rgba(255,255,255,.7);

  transition:
    transform .12s ease,
    box-shadow .2s ease;

  animation:
    floatCard 5s ease-in-out infinite;
}

.card-card:active {
  transform: scale(0.985);
}

.card-card::before {
  content: '';

  position: absolute;

  inset: 0;

  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,.18),
      transparent 40%
    );

  pointer-events: none;
}

@keyframes floatCard {
  0% {
    transform: translateY(0px);
  }

  50% {
    transform: translateY(-2px);
  }

  100% {
    transform: translateY(0px);
  }
}

/* ===== IMAGE ===== */

.card-cover {
  width: 100%;

  height: 210px;

  object-fit: cover;

  border-bottom:
    1px solid rgba(255,255,255,.3);

  background:
    linear-gradient(
      135deg,
      #dae6ff,
      #edf3ff
    );
}

.card-cover.placeholder {
  display: flex;

  align-items: center;

  justify-content: center;

  color: #7c879f;

  font-size: 14px;
}

/* ===== HEADER ===== */

.card-header {
  display: flex;

  align-items: center;

  justify-content: space-between;

  padding: 14px 16px;

  background:
    linear-gradient(
      135deg,
      rgba(96,133,255,.95),
      rgba(74,123,216,.92)
    );

  color: white;
}

.card-title {
  font-size: 1.05rem;

  font-weight: 700;

  letter-spacing: .3px;
}

.card-rarity {
  background:
    rgba(255,255,255,.18);

  padding: 5px 10px;

  border-radius: 999px;

  font-size: 13px;

  font-weight: 700;

  backdrop-filter: blur(6px);
}

/* ===== CONTENT ===== */

.card-content {
  padding: 14px 16px 10px;
}

.card-meta {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 10px;

  font-size: 14px;

  color: #44506b;
}

.card-meta strong {
  color: #20293c;
}

.power {
  color: #ff4d4f;

  font-weight: 700;
}

.health {
  color: #2fb36d;

  font-weight: 700;
}

/* ===== STATS ===== */

.card-stats {
  display: flex;

  flex-wrap: wrap;

  gap: 10px;

  margin-top: 14px;
}

.stat-chip {
  padding: 7px 12px;

  border-radius: 999px;

  background:
    rgba(109,156,255,.08);

  border:
    1px solid rgba(109,156,255,.16);

  color: #4d5c84;

  font-size: 12px;

  font-weight: 600;

  backdrop-filter: blur(6px);
}

/* ===== ACTIONS ===== */

.card-actions {
  padding: 12px 14px;

  border-top:
    1px solid rgba(0,0,0,.04);

  background:
    rgba(250,252,255,.6);

  backdrop-filter: blur(10px);
}

.card-actions ion-button {
  --border-radius: 14px;

  font-weight: 700;

  letter-spacing: .2px;
}

/* ===== EMPTY ===== */

.empty-state {
  padding: 40px 20px;

  text-align: center;

  color: #68748d;

  font-size: 15px;
}

.no-units {
  padding: 24px;

  text-align: center;

  color: #6b7280;
}

/* ===== MODAL ITEMS ===== */

ion-item {
  --background:
    rgba(255,255,255,.72);

  margin: 8px 12px;

  border-radius: 16px;

  backdrop-filter: blur(10px);

  border:
    1px solid rgba(255,255,255,.45);
}

ion-avatar img {
  border-radius: 14px;
}

/* ===== LAST ELEMENT ===== */

ion-col:last-of-type {
  margin-bottom: 170px !important;
}

/* ===== SCROLL ===== */

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-thumb {
  background:
    rgba(109,156,255,.35);

  border-radius: 999px;
}
/* Кастомные стили стеклянного модального окна */
.glass-modal {
  --height: 55% !important;
  --width: 100% !important;
  --border-radius: 28px 28px 0 0;
  align-items: flex-end;
  backdrop-filter: blur(12px);
}

.glass-toolbar {
  --background: rgba(248, 250, 255, 0.6);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.4);
}

.modal-title {
  font-weight: 700;
  font-size: 16px;
  color: #1a202c;
}

#close-btn {
  --color: #3182ce;
  font-weight: 600;
  font-size: 14px;
}

.glass-content {
  --background: linear-gradient(
    180deg,
    rgba(248, 250, 255, 0.96),
    rgba(235, 241, 255, 0.94)
  ) !important;
  backdrop-filter: blur(18px);
}

.glass-list {
  background: transparent !important;
  padding: 8px 4px;
}

.glass-item {
  --background: rgba(255, 255, 255, 0.72) !important;
  margin: 8px 12px;
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: 0 4px 10px rgba(160, 174, 192, 0.05);
}

/* Оформление внутренностей списка */
.unit-avatar {
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: #ffffff;
}
.unit-avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.unit-name {
  font-weight: 700;
  color: #2d3748;
  font-size: 15px;
  margin-bottom: 4px;
}

.unit-stats-row {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.stat-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.8);
  color: #4a5568;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.no-units {
  text-align: center;
  color: #718096;
  padding: 32px;
  font-size: 14px;
}

</style>