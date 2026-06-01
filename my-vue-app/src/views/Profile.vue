<template>
  <ion-page>
    <ion-modal
      :is-open="isModalOpen"
      :initial-breakpoint="0.3"
      :breakpoints="[0, 0.3]"
      :handle="true"
      @did-dismiss="handleModalDismiss"
    >
      <ion-content class="ion-padding modal-bottom-sheet">
        <div class="modal-text-container">
          <h2>Выход из аккаунта</h2>
          <p>Вы действительно хотите выйти из аккаунта?</p>
        </div>
        
        <div class="modal-buttons-group">
          <ion-button expand="block" fill="clear" color="medium" @click="closeModal">
            Отмена
          </ion-button>
          <ion-button expand="block" color="danger" @click="confirmLogout">
            Да, выйти
          </ion-button>
        </div>
      </ion-content>
    </ion-modal>

    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Профиль</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <ion-card>
        <ion-card-header>
          <ion-card-subtitle>Ваш профиль</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-item lines="none">
            <ion-label>Имя пользователя</ion-label>
            <ion-label slot="end" class="user-data">{{ username }}</ion-label>
          </ion-item>
          <ion-item lines="none">
            <ion-label>Емаил</ion-label>
            <ion-label slot="end" class="user-data">{{ userEmail }}</ion-label>
          </ion-item>
        </ion-card-content>

        <ion-card-header class="ion-no-padding-top">
          <ion-card-subtitle>Игровая статистика</ion-card-subtitle>
          <ion-card-title>Ваши достижения</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item lines="none">
            <ion-label>Победы:</ion-label>
            <ion-label slot="end" class="stat-value">{{ stats.wins }}</ion-label>
          </ion-item>
          <ion-item lines="none">
            <ion-label>Матчи:</ion-label>
            <ion-label slot="end" class="stat-value">{{ stats.matches }}</ion-label>
          </ion-item>
          <ion-item lines="none">
            <ion-label>Win Rate:</ion-label>
            <ion-label slot="end" class="stat-value win-rate">{{ stats.winRate }}%</ion-label>
          </ion-item>
        </ion-card-content>
      </ion-card>

      <div class="logout-btn-container">
        <ion-button expand="block" fill="outline" color="danger" @click="openModal">
          Выйти из аккаунта
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { onMounted, ref, inject } from 'vue';
import { useRouter } from 'vue-router';
import { apiFetch } from '@/utilit/fetchUtils.ts';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonItem, IonLabel, IonButton, IonCard, IonCardHeader, 
  IonCardTitle, IonCardSubtitle, IonCardContent, IonModal, 
  IonButtons, IonMenuButton 
} from '@ionic/vue';

const router = useRouter();
const isModalOpen = ref(false);
const auth = inject('auth');

const stats = ref({
  wins: 0,
  matches: 0,
  winRate: 0
});

const username = ref('');
const userEmail = ref('');

const getUser = async () => {
  try {
    const response = await apiFetch('http://localhost:3000/api/getUser', {
      method: 'POST',
      body: JSON.stringify({ id: localStorage.getItem("auth") })
    });
    if (response && response[0]) {
      username.value = response[0].username;
      userEmail.value = response[0].email;
      stats.value.wins = response[0].wins || 0;
      stats.value.matches = response[0].matches || 0;
      stats.value.winRate = response[0].matches > 0 
        ? ((response[0].wins / response[0].matches) * 100).toFixed(1) 
        : '0.0';
    }
  } catch (error) {
    console.error('Ошибка при получении профиля:', error);
  }
};

onMounted(() => {
  getUser();
});

const openModal = () => { isModalOpen.value = true; };
const closeModal = () => { isModalOpen.value = false; };

const confirmLogout = () => {
  localStorage.clear();
  if (auth?.value?.setAuth) auth.value.setAuth(false);
  isModalOpen.value = false;
  router.push('/tabs/tab1');
};

const handleModalDismiss = () => { isModalOpen.value = false; };
</script>

<style scoped>
/* Стили для модального окна */
.modal-text-container {
  text-align: center;
  margin-top: 15px;
  margin-bottom: 25px;
}

.modal-text-container h2 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}

.modal-text-container p {
  color: var(--ion-color-medium);
  margin: 0;
}

.modal-buttons-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* Оформление элементов карточки */
.user-data {
  color: var(--ion-color-dark);
  font-weight: 500;
}

.stat-value {
  font-weight: 600;
}

.win-rate {
  color: var(--ion-color-success, #2dd36f);
}

.ion-no-padding-top {
  padding-top: 0;
}

.logout-btn-container {
  margin: 24px;
}
</style>
