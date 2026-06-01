<script setup>
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet,onIonViewWillEnter } from '@ionic/vue';
import {mailOutline,heart,star,home,settings,person,add,exit,logIn,personAdd,logOut,cart,folder,play} from 'ionicons/icons';
import { ellipse, square, triangle } from 'ionicons/icons';
import { ref, onMounted,provide } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
const authData = ref({
  auth: false,
  setAuth(newAuth) {
    this.auth = newAuth;
  }
});
provide('auth', authData);
onMounted(async () => {
  await loadCheck();
});
const loadCheck = async () => {
  authData.value.auth=localStorage.getItem("auth") !== null;
}
</script>
<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="tab1" href="/tabs/tab2" v-if="!authData.auth">
          <ion-icon aria-hidden="true" :icon="logIn" />
          <ion-label>Авторизация</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab2" href="/tabs/tab1" v-if="!authData.auth">
          <ion-icon aria-hidden="true" :icon="personAdd" />
          <ion-label>Регистрация</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab3" href="/tabs/profile" v-if="authData.auth">
          <ion-icon aria-hidden="false" :icon="person" />
          <ion-label>Профиль</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab4" href="/tabs/collection" v-if="authData.auth">
          <ion-icon aria-hidden="false" :icon="folder" />
          <ion-label>Коллекция</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab5" href="/tabs/stats" v-if="authData.auth">
          <ion-icon aria-hidden="false" :icon="play" />
          <ion-label>Играть</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab6" href="/tabs/settings" v-if="authData.auth">
          <ion-icon aria-hidden="false" :icon="cart" />
          <ion-label>Магазин</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>
<style>
:root{
    --color-selected: #007bff !important;
    --ripple-color: #007bff !important;
    --ion-color-primary:#007bff !important;

}
ion-list{
  --ion-background-color: #007bff !important;
  padding: 10px !important;
}
*{
  font-weight: 600;
}
ion-title{
  color: white !important;

  font-weight: 700;
}
:root.md {
    --ion-text-color: #212529 !important;
  --ion-background-color-step-550:white !important;
  --ion-background-color-step-150: white !important;
  --ion-text-color-step-150: white !important;
  --ion-text-color-step-350: white !important;
  --ion-color-step-650: white !important;
  --ion-tab-bar-color:#989aa2 !important;
  --ion-card-background:#212529 !important;
}
ion-item {
  --background: #ffffff;
  --border-color: #212529 !important;
  --color: var(--ion-item-color, var(--ion-text-color, #212529));
}
ion-alert ,ion-alert *{
  --background: #212529 !important;
  --color: #212529 !important;
  --border-color: white;
}

form{
    border: 1px solid #212529;
}

ion-input {
  border-left: 1px #212529 solid;
  --highlight-color-valid: green;
  --highlight-color-invalid: red;
}
.native-input.sc-ion-input-md {
    padding-left: 10px !important;
  }
ion-radio {
  --color: #007bff !important;
  --checkmark-color: #ffffff !important;
}
h4 {
  color: white !important;
}
ion-tab-bar ion-label{
    color: white !important;
}
ion-label{
    color: #212529 !important;
}
ion-button{
  color: #212529 !important;
}
.list-md {
  background:#007bff !important;
  color: #212529 !important;
  --ion-text-color: #212529 !important;
}
ion-title{
  width: 100% !important;
  text-align: center !important;
}
ion-card{
  border-radius: 10px;
  max-width: 540px !important;
  margin-left:auto !important;
  margin-right:auto !important;
  width:90%;
}
ion-button{
    border-radius: 20px;
}
ion-card-title{
  font-size: 30px;
}
ion-row{
display:block !important;
max-width: 540px !important;
margin:0 auto !important;
height:max-content !important;
}
ion-grid{
height:1500px !important;
}
</style>