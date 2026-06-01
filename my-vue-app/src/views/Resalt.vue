<template>
  <ion-page class="shop-content page-result">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs" />
        </ion-buttons>
        <ion-title>Результат матча</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="result-content" fullscreen>
      <div class="result-card-wrap">
        <ion-card :class="['result-card', isWin ? 'win' : 'lose']">
          <div class="card-header">
            <div class="badge" :class="isWin ? 'win-badge' : 'lose-badge'">
              <span>{{ isWin ? "😊  " : "😢  " }}{{ isWin ? 'Победа!' : 'Поражение' }}</span>
            </div>
          </div>

          <ion-card-content class="card-content">
            <div class="status" :class="isWin ? 'win-title' : 'lose-title'">
              {{ isWin ? 'Поздравляем! Вы победили!' : 'Похоже, вы проиграли' }}
            </div>

            <div class="cta-row">
              <ion-button expand="block" color="secondary" @click="goToMain">
                Вернуться на главную
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { happy, sad } from 'ionicons/icons';

const router = useRouter();

const isWin = ref(false);
const dateText = ref('');
const scoreText = ref('');
const trophyIcon = happy;
const sadIcon = sad;

onMounted(() => {
  const winStatus = localStorage.getItem('isWin');
  isWin.value = winStatus === 'true';
});

function goToMain() {
  localStorage.setItem('isWin', '');
  window.location.assign('/tabs/stats');
}
</script>

<style scoped>
.page-result {
  min-height: 100%;
  background: 
  radial-gradient(circle at 20% -10%, rgba(0, 171, 255, 0.12), transparent 20%),
  radial-gradient(circle at 90% 0%, rgba(0, 214, 120, 0.12), transparent 20%),
  #f7f8fb;
}

.result-content {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 28px 16px;
}

.result-card-wrap {
  margin: 0 auto;
  width: min(720px, 92%);
}

.result-card {
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
  background: #fff;
}
.result-card.win .card-header {
  background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
}
.result-card.lose .card-header {
  background: linear-gradient(135deg, #e11d48 0%, #c62828 100%);
}
.card-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 14px 16px;
  color: #fff;
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  font-size: 1rem;
  padding: 6px 14px;
  border-radius: 999px;
}
.win-badge {
  color: #e6fbe6;
  background: rgba(46, 134, 64, 0.25);
  border: 1px solid rgba(46, 134, 64, 0.5);
}
.lose-badge {
  color: #ffeef0;
  background: rgba(214, 66, 66, 0.25);
  border: 1px solid rgba(214, 66, 66, 0.5);
}
.card-content {
  text-align: center;
  padding: 22px 22px 28px;
}
.status {
  font-weight: 900;
  font-size: 1.8rem;
  margin: 8px 0 12px;
}
.win-title { color: #2e7d32; }
.lose-title { color: #c62828; }

.details {
  margin: 6px 0 18px;
}
.chips {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}
.chip {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  color: #374151;
}

.cta-row {
  margin-top: 6px;
}
@media (min-width: 768px) {
  .result-content { padding: 40px 0; }
  .card-content { padding: 28px 40px; }
}
</style>
