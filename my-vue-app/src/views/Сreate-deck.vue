<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/collection"></ion-back-button>
        </ion-buttons>
        <ion-title>Мои колоды</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="create-deck-content">
      <ion-button
        expand="block"
        color="primary"
        style="margin: 12px;"
        @click="openAddDeckModal"
      >
        Добавить колоду
      </ion-button>


        <ion-col
                v-for="deck in decks" 
                :key="deck.id" 
                @click="openDeckCards(deck)"
                size="6"
                style="margin-bottom: 10px;"
              >
                <ion-card
                >
                  <template v-if="deck?.card_id1_details?.image_url">
                    <img
                      :src="'http://localhost:3000/images/' + deck?.card_id1_details?.image_url + '.png'"
                      alt="Обложка карты"
                      class="card-img"
                    />
                  </template>
                  <template v-else>
                    <div class="card-img placeholder"></div>
                  </template>
                  <ion-card-header>
                    <ion-card-title>{{ deck.name }}</ion-card-title>
                  </ion-card-header>
                </ion-card>
              </ion-col>


      <!-- Модальное окно для создания новой колоды -->
      <ion-modal :is-open="showAddDeckModal" :backdrop-dismiss="false"  >

          <ion-toolbar>
            <ion-title>Создать новую колоду</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeAddDeckModal">Закрыть</ion-button>
            </ion-buttons>
          </ion-toolbar>


        <ion-content>
          <ion-searchbar v-model="searchCards" placeholder="Поиск карт..."></ion-searchbar>
          <ion-item>
            <ion-input v-model="newDeckName" placeholder="Введите название"></ion-input>
          </ion-item>
          <ion-grid fixed>
            <ion-row>
              <ion-col
                v-for="card in filteredAllCards"
                :key="card.id"
                size="6"
                style="margin-bottom: 10px;"
              >
                <ion-card
                  :class="{ selected: selectedNewDeckCards.includes(card.id) }"
                  @click="toggleNewDeckCard(card.id)"
                >
                  <template v-if="card.image_url">
                    <img
                      :src="'http://localhost:3000/images/' + card.image_url + '.png'"
                      alt="Обложка карты"
                      class="card-img"
                    />
                  </template>
                  <template v-else>
                    <div class="card-img placeholder"></div>
                  </template>
                  <ion-card-header>
                    <ion-card-title>{{ card.name }}</ion-card-title>
                  </ion-card-header>
                </ion-card>
              </ion-col>
            </ion-row>
          </ion-grid>

          <div style="margin: 16px; text-align: center;">
            <p>Выбрано карт: {{ selectedNewDeckCards.length }} / 3</p>
            <ion-button
              :disabled="selectedNewDeckCards.length !== 3 || !newDeckName"
              color="success"
              @click="createNewDeck"
            >
              Создать колоду
            </ion-button>
          </div>
        </ion-content>
      </ion-modal>
      
      <ion-modal :is-open="showDeckCardsModal" @didDismiss="closeDeckCardsModal">
        <ion-content>
          <ion-toolbar>
            <ion-title>Карта колоды: {{ selectedDeck?.name }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeDeckCardsModal">Закрыть</ion-button>
            </ion-buttons>
          </ion-toolbar>
        <ion-col
                size="6"
                style="margin-bottom: 10px;"
              >
                <ion-card
                >
                  <template v-if="selectedDeck?.card_id1_details.image_url">
                    <img
                      :src="'http://localhost:3000/images/' + selectedDeck?.card_id1_details.image_url + '.png'"
                      alt="Обложка карты"
                      class="card-img"
                    />
                  </template>
                  <template v-else>
                    <div class="card-img placeholder"></div>
                  </template>
                  <ion-card-header>
                    <ion-card-title>{{ selectedDeck?.card_id1_details?.name }}</ion-card-title>
                  </ion-card-header>
                </ion-card>
                <ion-card
                >
                  <template v-if="selectedDeck?.card_id2_details.image_url">
                    <img
                      :src="'http://localhost:3000/images/' + selectedDeck?.card_id2_details.image_url + '.png'"
                      alt="Обложка карты"
                      class="card-img"
                    />
                  </template>
                  <template v-else>
                    <div class="card-img placeholder"></div>
                  </template>
                  <ion-card-header>
                    <ion-card-title>{{ selectedDeck?.card_id2_details?.name }}</ion-card-title>
                  </ion-card-header>
                </ion-card>
                <ion-card
                >
                  <template v-if="selectedDeck?.card_id3_details.image_url">
                    <img
                      :src="'http://localhost:3000/images/' + selectedDeck?.card_id3_details.image_url + '.png'"
                      alt="Обложка карты"
                      class="card-img"
                    />
                  </template>
                  <template v-else>
                    <div class="card-img placeholder"></div>
                  </template>
                  <ion-card-header>
                    <ion-card-title>{{ selectedDeck?.card_id3_details?.name }}</ion-card-title>
                  </ion-card-header>
                </ion-card>
              </ion-col>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonTextarea, IonButton } from '@ionic/vue';
import { ref, computed, onMounted } from 'vue';
import { apiFetch } from '@/utilit/fetchUtils.ts';

const showAddDeckModal = ref(false);
const newDeckName = ref('');
const allCards = ref([]);
const decks = ref([]);
const searchCards = ref('');
const selectedNewDeckCards = ref([]);
const selectedDeck = ref(null); 
const showDeckCardsModal = ref(false);

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
    const mergedDeck = mergeCards(response, response2);
    decks.value=mergedDeck;
  } catch (error) {
    console.error('Ошибка загрузки колод:', error);
  }
};

onMounted(async () => {
  await fetchCollections();
});

const openAddDeckModal = () => {
  selectedNewDeckCards.value = [];
  newDeckName.value = '';
  showAddDeckModal.value = true;
};

const closeAddDeckModal = () => {
  showAddDeckModal.value = false;
};

const openDeckCards = (deck) => {
  selectedDeck.value = deck;
  console.log(selectedDeck.value);
  showDeckCardsModal.value = true;
};

const closeDeckCardsModal = () => {
  showDeckCardsModal.value = false;
  selectedDeck.value = null;
};

const filteredAllCards = computed(() => {
  const q = searchCards.value.toLowerCase();
  return allCards.value.filter(c => c.name.toLowerCase().includes(q));
});

const toggleNewDeckCard = (cardId) => {
  const index = selectedNewDeckCards.value.indexOf(cardId);
  if (index === -1) {
    if (selectedNewDeckCards.value.length < 3) {
      selectedNewDeckCards.value.push(cardId);
    }
  } else {
    selectedNewDeckCards.value.splice(index, 1);
  }
};

const createNewDeck = async () => {
  if (selectedNewDeckCards.value.length !== 3 || !newDeckName.value) return;
  console.log(selectedNewDeckCards.value)
  try {
    await apiFetch('http://localhost:3000/api/createDeck', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newDeckName.value,
        id: localStorage.getItem('auth'),
        card1: selectedNewDeckCards.value[0],
        card2: selectedNewDeckCards.value[1],
        card3: selectedNewDeckCards.value[2],
      }),
    });
    await fetchCollections();
    closeAddDeckModal();
  } catch (error) {
    console.error('Ошибка при создании колоды:', error);
  }
};
function mergeCards(deck, cardsArray) {
  const cardsMap = {};
  cardsArray.forEach(card => {
    cardsMap[card.id] = card;
  });

  ['card_id1', 'card_id2', 'card_id3'].forEach(field => {
    const cardId = deck[0][field];
    if (cardId && cardsMap[cardId]) {
      deck[0][field + '_details'] = cardsMap[cardId];
    }
  });

  return deck;
}
</script>

<style scoped>

/* ===== BACKGROUND ===== */

.create-deck-content {
  --ion-background-color: #eef3ff;

  background:
    radial-gradient(circle at top left, rgba(109,156,255,.16), transparent 25%),
    radial-gradient(circle at bottom right, rgba(72,92,255,.10), transparent 25%),
    linear-gradient(135deg, #f5f7ff 0%, #e9eefb 100%);

  padding-bottom: env(safe-area-inset-bottom);
}

/* ===== TOOLBAR ===== */

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

/* ===== BUTTON ===== */

ion-button {
  --border-radius: 18px;
  color:white !important;
  font-weight: 700;

  letter-spacing: .3px;
}

ion-button[color="primary"]{
  margin: 14px 16px !important;

  --background:
    linear-gradient(
      135deg,
      #6d9cff,
      #4a7bd8
    );

  box-shadow:
    0 10px 24px rgba(74,123,216,.22);
}

ion-button[color="success"]{
  --background:
    linear-gradient(
      135deg,
      #39c97c,
      #28a86a
    );

  box-shadow:
    0 10px 24px rgba(57,201,124,.22);
}

/* ===== GRID ===== */

ion-grid{
  height: max-content !important;

  padding: 12px;
}

/* ===== CARD ===== */

ion-card {
  position: relative;

  overflow: hidden;

  border-radius: 24px;

  background:
    rgba(255,255,255,.82);

  backdrop-filter: blur(14px);

  border:
    1px solid rgba(255,255,255,.5);

  box-shadow:
    0 10px 30px rgba(40,60,120,.10),
    inset 0 1px 0 rgba(255,255,255,.7);

  transition:
    transform .12s ease,
    box-shadow .2s ease;
}

ion-card:active {
  transform: scale(.985);
}

ion-card::before {
  content: '';

  position: absolute;

  inset: 0;

  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,.16),
      transparent 40%
    );

  pointer-events: none;
}

/* ===== IMAGE ===== */

.card-img {
  width: 100%;

  height: 180px;

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

.card-img.placeholder {
  background:
    linear-gradient(
      135deg,
      #dbe5ff,
      #edf3ff
    );
}

/* ===== HEADER ===== */

ion-card-header {
  padding: 14px 16px;

  background:
    linear-gradient(
      135deg,
      rgba(96,133,255,.95),
      rgba(74,123,216,.92)
    );
}

ion-card-title {
  color: white;

  font-size: 1rem;

  font-weight: 700;

  letter-spacing: .3px;
}

/* ===== SELECTED ===== */

ion-card.selected {
  border:
    2px solid rgba(74,123,216,.75);

  box-shadow:
    0 0 0 3px rgba(109,156,255,.18),
    0 12px 28px rgba(74,123,216,.20);
}

/* ===== MODAL ===== */

ion-modal {
  --height: 78%;
  --width: 100%;
  --border-radius: 28px 28px 0 0;

  align-items: flex-end;

  backdrop-filter: blur(12px);
}

ion-modal::part(backdrop){
  background: rgba(8,12,20,.42);

  backdrop-filter: blur(8px);
}

/* ===== MODAL TOOLBAR ===== */

ion-modal ion-toolbar{
  --background:
    rgba(20,26,38,.94);

  color: white;

  border-bottom:
    1px solid rgba(255,255,255,.06);
}

ion-modal ion-title{
  color: white;

  font-weight: 700;
}

/* ===== MODAL CONTENT ===== */

ion-modal ion-content{
  --background:
    linear-gradient(
      180deg,
      rgba(248,250,255,.96),
      rgba(235,241,255,.94)
    );
}

/* ===== SEARCH ===== */

ion-searchbar {
  margin: 14px;

  border-radius: 18px;

  --background:
    rgba(255,255,255,.78);

  --box-shadow:
    0 8px 20px rgba(70,90,140,.08);

  backdrop-filter: blur(10px);

  color: #444 !important;
}

/* ===== INPUT ===== */

ion-item {
  --background:
    rgba(255,255,255,.72);

  margin: 10px 14px;

  border-radius: 18px;

  backdrop-filter: blur(10px);

  border:
    1px solid rgba(255,255,255,.45);

  box-shadow:
    0 6px 16px rgba(60,80,140,.06);
}

ion-input {
  --padding-start: 8px;

  color: #2d3a58;
}

/* ===== COUNTER ===== */

.deck-counter {
  margin: 18px 0;

  text-align: center;

  color: #5c6784;

  font-weight: 600;
}

/* ===== LAST ELEMENT ===== */

ion-col:last-of-type {
  margin-bottom: 160px !important;
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

</style>