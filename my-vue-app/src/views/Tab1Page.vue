<template>
  <ion-page>
    <!-- Минималистичный прозрачный заголовок -->
    <ion-header class="ion-no-border">
      <ion-toolbar class="glass-toolbar">
        <ion-title class="auth-title">Создание аккаунта</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen class="auth-content ion-padding">
      <!-- Стеклянная карточка регистрации лежит напрямую в контенте -->
        <div class="glass-auth-card">
        <h2 class="welcome-text">Регистрация</h2>
        <p class="welcome-subtext">Создайте профиль, чтобы присоединиться к игре</p>

        <form @submit.prevent="onSubmit" class="auth-form">
          <!-- Имя пользователя -->
          <div class="input-field-wrapper">
            <ion-input
              v-model="formData.name"
              type="text"
              label="Имя пользователя"
              label-placement="floating"
              fill="none"
              name="name"
              autocomplete="name"
              required
              class="custom-input"
            ></ion-input>
          </div>

          <!-- Email -->
          <div class="input-field-wrapper">
            <ion-input
              v-model="formData.email"
              type="email"
              label="Электронная почта"
              label-placement="floating"
              fill="none"
              name="email"
              autocomplete="email"
              required
              class="custom-input"
            ></ion-input>
          </div>

          <!-- Пароль -->
          <div class="input-field-wrapper">
            <ion-input
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              label="Пароль"
              label-placement="floating"
              fill="none"
              name="password"
              autocomplete="new-password"
              required
              class="custom-input"
            >
              <ion-button fill="clear" slot="end" class="toggle-pwd-btn" @click="togglePasswordVisibility">
                {{ showPassword ? '👁️' : '🙈' }}
              </ion-button>
            </ion-input>
          </div>

          <!-- Сообщение об ошибке -->
          <div v-if="errorMessage" class="error-toast-box" role="alert">
            <span class="err-dot">⚠️</span> {{ errorMessage }}
          </div>

          <!-- Кнопка отправки -->
          <ion-button
            type="submit"
            expand="block"
            color="primary"
            :disabled="loading"
            class="auth-submit-btn"
          >
            {{ loading ? 'Создание...' : 'Зарегистрироваться' }}
          </ion-button>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, inject, onMounted } from 'vue';
import { apiFetch } from '@/utilit/fetchUtils.ts';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonInput, IonButton
} from '@ionic/vue';

const auth = inject('auth');
const router = useRouter();

const formData = ref({
  name: '',
  password: '',
  email: ''
});
const errorMessage = ref('');
const loading = ref(false);
const showPassword = ref(false);

onMounted(() => {
  if (localStorage.getItem("auth")) {
    router.push('/tabs/collection');
  }
});

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const onSubmit = async () => {
  errorMessage.value = '';
  loading.value = true;
  try {
    const response = await apiFetch('http://localhost:3000/api/addUser', {
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData.value)
    });
    if (!response) {
      errorMessage.value = 'Такой пользователь уже существует';
      loading.value = false;
      return;
    }
    
    const authData = typeof response === 'object' ? JSON.stringify(response) : response;
    localStorage.setItem('auth', authData);
    
    if (auth?.value?.setAuth) auth.value.setAuth(true);
    router.push('/tabs/collection');
  } catch (err) {
    console.error('Ошибка регистрации:', err);
    errorMessage.value = 'Ошибка при создании аккаунта';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Фоновый контейнер под общий стиль проекта */
ion-content {
  --ion-background-color: #f4f6fa;
  background: linear-gradient(145deg, #f4f6fa 0%, #eef2f9 100%);
  position: relative;
}

.glass-toolbar {
  --background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
}

.auth-title {
  font-weight: 700;
  font-size: 17px;
  color: #2d3748;
  text-align: center;
}

/* Абсолютное позиционирование стеклянной формы по центру */
.glass-auth-card {
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
  
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: none !important;
  border-radius: 24px;
  padding: 28px 20px;
  box-shadow: 0 16px 36px rgba(142, 153, 185, 0.18);
  text-align: center;
  
  width: calc(100% - 32px); 
  max-width: 320px;
  box-sizing: border-box;
}

.auth-icon-header {
  width: 64px;
  height: 64px;
  background: #ffffff;
  border-radius: 50%;
  margin: 0 auto 16px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(160, 174, 192, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.lock-icon {
  font-size: 24px;
}

.welcome-text {
  font-size: 22px;
  font-weight: 800;
  color: #1a202c;
  margin: 0 0 4px 0;
}

.welcome-subtext {
  font-size: 13px;
  color: #718096;
  margin: 0 0 24px 0;
}

/* Фикс формы от лишних квадратов и рамок */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.input-field-wrapper {
  text-align: left;
  width: 100%;
}

/* Монолитный кастомный инпут с мягкой подложкой */
.custom-input {
  --border-width: 0px !important;
  --border-color: transparent !important;
  --border-style: none !important;
  
  --background: rgba(0, 0, 0, 0.04); 
  --border-radius: 12px;
  --padding-start: 16px;
  --padding-end: 12px;
  --color: #2d3748;
  --highlight-color-focused: #3880ff;
  font-size: 15px;
  width: 100%;
}

.toggle-pwd-btn {
  margin: 0;
  font-size: 16px;
  height: 100%;
}

.error-toast-box {
  background: rgba(254, 242, 242, 0.9);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #dc2626;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
}

.err-dot {
  font-size: 14px;
}

.auth-submit-btn {
  --border-radius: 12px;
  --box-shadow: 0 4px 12px rgba(56, 128, 255, 0.25);
  font-weight: 600;
  height: 48px;
  margin-top: 4px;
}
</style>
