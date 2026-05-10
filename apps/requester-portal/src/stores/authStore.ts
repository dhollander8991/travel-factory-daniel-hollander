import { ref, computed } from 'vue';
import { User } from '@org/shared';

// We use a simple module-level store instead of Pinia or Vuex
// For this project size it's sufficient and avoids extra dependencies

const token = ref<string | null>(localStorage.getItem('token'));
const user = ref<User | null>(
  JSON.parse(localStorage.getItem('user') || 'null')
);

const isAuthenticated = computed(() => !!token.value);

/**
 * Sets the auth state after successful login or register
 * Persists to localStorage so it survives page refresh
 */
const setAuth = ({ newToken, newUser }: { newToken: string; newUser: User }) => {
  token.value = newToken;
  user.value = newUser;
  localStorage.setItem('token', newToken);
  localStorage.setItem('user', JSON.stringify(newUser));
};

/**
 * Clears auth state on logout
 * Removes token and user from both memory and localStorage
 */
const clearAuth = () => {
  token.value = null;
  user.value = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const useAuthStore = () => ({
  token,
  user,
  isAuthenticated,
  setAuth,
  clearAuth,
});