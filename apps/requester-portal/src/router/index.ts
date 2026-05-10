import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { UserRole } from '@org/shared';

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { guest: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue'),
    meta: { guest: true },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
];

export const createAppRouter = () => {
  const router = createRouter({
    history: createWebHistory(),
    routes,
  });

  router.beforeEach((to, _from) => {
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');

    // Valid session requires both a token and the correct role for this portal
    const hasCorrectRole = storedUser?.role === UserRole.REQUESTER;
    const isAuthenticated = !!token && hasCorrectRole;

    // Wrong role stored — clear immediately so the user must log in with a requester account
    if (token && !hasCorrectRole) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    if (to.meta.requiresAuth && !isAuthenticated) {
      return { name: 'login' };
    }

    if (to.meta.guest && isAuthenticated) {
      return { name: 'dashboard' };
    }
  });

  return router;
};
