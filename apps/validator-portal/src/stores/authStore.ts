import { ref, computed } from 'vue';
import { User } from '@org/shared';

// We use a simple module-level store instead of Pinia or Vuex
// For this project size it's sufficient and avoids extra dependencies
// The state is defined outside the function so it's shared across all components
// that import this store — it's a singleton

// ref() creates reactive state — when these change Vue re-renders components
const token = ref<string | null>(localStorage.getItem('token'));
const user = ref<User | null>(
  // Parse the stored user JSON — null if nothing stored
  JSON.parse(localStorage.getItem('user') || 'null')
);

// computed() derives a value from reactive state
// isAuthenticated is true when we have a token
// It updates automatically when token changes
const isAuthenticated = computed(() => !!token.value);

/**
 * Sets the auth state after successful login or register
 * Persists to localStorage so it survives page refresh
 */
const setAuth = ({ newToken, newUser }: { newToken: string; newUser: User }) => {
  token.value = newToken;
  user.value = newUser;
  // localStorage persists data across page refreshes
  // Without this the user would be logged out every time they refresh
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

// Export as a composable — useAuthStore() returns the store
// This pattern is called a "composable store" — same concept as Pinia
// but without the extra library
export const useAuthStore = () => ({
  token,
  user,
  isAuthenticated,
  setAuth,
  clearAuth,
});