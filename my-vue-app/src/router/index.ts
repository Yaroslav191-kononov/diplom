import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/tab1'
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/tab1'
      },
      {
        path: 'tab1',
        component: () => import('@/views/Tab1Page.vue')
      },
      {
        path: 'tab2',
        component: () => import('@/views/Tab2Page.vue')
      },
      {
        path: 'collection',
        component: () => import('@/views/Collection.vue')
      },
      {
        path: 'stats',
        component: () => import('@/views/Stats.vue')
      },
      {
        path: 'settings',
        component: () => import('@/views/Setting.vue')
      },
      {
        path: 'profile',
        component: () => import('@/views/Profile.vue')
      },
            {
        path: 'game',
        component: () => import('@/views/Battle.vue')
      },
                  {
        path: 'resalt',
        component: () => import('@/views/Resalt.vue')
      },
                        {
        path: 'create-deck',
        component: () => import('@/views/Сreate-deck.vue')
      },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
