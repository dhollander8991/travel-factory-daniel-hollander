<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import { useAuthStore } from '../stores/authStore';
import api from '../services/axios';

const router = useRouter();
const toast = useToast();
const { setAuth } = useAuthStore();

const email = ref<string>('');
const password = ref<string>('');
const loading = ref<boolean>(false);
const errors = ref<Record<string, string>>({});

const validate = (): boolean => {
  errors.value = {};
  if (!email.value) {
    errors.value.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(email.value)) {
    errors.value.email = 'Invalid email address';
  }
  if (!password.value) {
    errors.value.password = 'Password is required';
  }
  return Object.keys(errors.value).length === 0;
};

const handleLogin = async (): Promise<void> => {
  if (!validate()) return;
  loading.value = true;
  try {
    const response = await api.post('/api/v1/auth/login/validator', {
      email: email.value,
      password: password.value,
    });
    const { token, user } = response.data.data;
    setAuth({ newToken: token, newUser: user });
    toast.add({
      severity: 'success',
      summary: 'Welcome back!',
      detail: `Logged in as ${user.name}`,
      life: 3000,
    });
    router.push({ name: 'dashboard' });
  } catch (error: any) {
    const message = error.response?.data?.error?.message || 'Login failed';
    toast.add({
      severity: 'error',
      summary: 'Login failed',
      detail: message,
      life: 5000,
    });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <i class="pi pi-shield" />
        <h1>Vacation Manager</h1>
        <span class="portal-tag">Manager Portal</span>
      </div>

      <div class="tab-row">
        <button class="tab active">Sign in</button>
        <RouterLink to="/register" class="tab">Sign up</RouterLink>
      </div>

      <h2>Welcome back</h2>
      <p class="subtitle">Sign in to review vacation requests</p>

      <div class="form">
        <div class="field">
          <label for="email">Email address</label>
          <InputText
            id="email"
            v-model="email"
            type="email"
            placeholder="you@company.com"
            :class="{ 'p-invalid': errors.email }"
            fluid
          />
          <small v-if="errors.email" class="error">{{ errors.email }}</small>
        </div>

        <div class="field">
          <label for="password">Password</label>
          <Password
            id="password"
            v-model="password"
            placeholder="••••••••"
            :feedback="false"
            :class="{ 'p-invalid': errors.password }"
            fluid
            toggleMask
          />
          <small v-if="errors.password" class="error">{{ errors.password }}</small>
        </div>

        <Button
          label="Sign in"
          icon="pi pi-sign-in"
          :loading="loading"
          :disabled="loading"
          @click="handleLogin"
          fluid
          severity="success"
        />
      </div>

      <p class="switch-text">
        No account?
        <RouterLink to="/register">Sign up here</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, var(--p-surface-100) 0%, var(--p-surface-50) 100%);
}

  .login-card {
    background: var(--p-surface-0);
    border-radius: 16px;
    padding: 40px;
    width: 100%;
    max-width: 420px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04), 0 12px 40px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--p-surface-200);
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: auto;
  }

  @media (max-width: 768px) {
    .login-card {
      height: 100%;
    }
  }

.login-header {
  text-align: center;
  margin-bottom: 28px;
}

.login-header i {
  font-size: 36px;
  color: var(--p-green-500);
  display: block;
  margin-bottom: 12px;
}

.login-header h1 {
  font-size: 21px;
  font-weight: 700;
  margin: 0 0 6px;
  letter-spacing: -0.02em;
}

.portal-tag {
  font-size: 11px;
  font-weight: 500;
  padding: 3px 12px;
  border-radius: 20px;
  background: var(--p-green-100);
  color: var(--p-green-700);
  letter-spacing: 0.02em;
}

.tab-row {
  display: flex;
  border-bottom: 1px solid var(--p-surface-200);
  margin-bottom: 20px;
}

.tab {
  flex: 1;
  padding: 10px;
  text-align: center;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: var(--p-text-muted-color);
  text-decoration: none;
}

.tab.active {
  color: var(--p-green-500);
  border-bottom: 2px solid var(--p-green-500);
  font-weight: 500;
}

h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 13px;
  color: var(--p-text-muted-color);
  margin-bottom: 20px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 13px;
  font-weight: 500;
}

.error {
  color: var(--p-red-500);
  font-size: 12px;
}

.switch-text {
  text-align: center;
  margin-top: 20px;
  font-size: 13px;
  color: var(--p-text-muted-color);
}

.switch-text a {
  color: var(--p-green-500);
  text-decoration: none;
  font-weight: 500;
}
</style>
