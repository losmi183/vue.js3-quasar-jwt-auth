import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/IndexPage.vue') }],
  },
  // AUTH
  {
    path: '/login',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/auth/LoginPage.vue') }],
  },
  {
    path: '/register',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/auth/RegisterPage.vue') }],
  },
  {
    path: '/forgot-password',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/auth/ForgotPasswordPage.vue') }],
  },
  {
    path: '/reset-password/:forgot_password_token',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/auth/ResetPasswordPage.vue') }],
  },

  {
    path: '/profile',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/auth/ProfilePage.vue') }],
  },

  {
    path: '/conversation/:conversationId',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/ConversationPage.vue') }],
  },

  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
