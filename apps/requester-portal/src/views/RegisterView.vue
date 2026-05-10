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

const name = ref<string>('');
const email = ref<string>('');
const password = ref<string>('');
const confirmPassword = ref<string>('');
const loading = ref<boolean>(false);
const errors = ref<Record<string, string>>({});

const validate = (): boolean => {
  errors.value = {};

  if (!name.value || name.value.trim().length < 2) {
    errors.value.name = 'Name must be at least 2 characters';
  }

  if (!email.value) {
    errors.value.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(email.value)) {
    errors.value.email = 'Invalid email address';
  }

  if (!password.value || password.value.length < 8) {
    errors.value.password = 'Password must be at least 8 characters';
  }

  if (password.value !== confirmPassword.value) {
    errors.value.confirmPassword = 'Passwords do not match';
  }

  return Object.keys(errors.value).length === 0;
};

const handleRegister = async (): Promise<void> => {
  if (!validate()) return;

  loading.value = true;

  try {
    // Register the user — role is always Requester on this portal
    // The validator portal sends role: Validator instead
    await api.post('/api/v1/auth/register/requester', {
      name: name.value,
      email: email.value,
      password: password.value,
    });

    const loginResponse = await api.post('/api/v1/auth/login/requester', {
      email: email.value,
      password: password.value,
    });

    const { token, user } = loginResponse.data.data;
    setAuth({ newToken: token, newUser: user });

    toast.add({
      severity: 'success',
      summary: 'Account created!',
      detail: `Welcome, ${user.name}`,
      life: 3000,
    });

    router.push({ name: 'dashboard' });
  } catch (error: any) {
    const message = error.response?.data?.error?.message || 'Registration failed';
    toast.add({
      severity: 'error',
      summary: 'Registration failed',
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
        <i class="pi pi-sun" />
        <h1>Vacation Manager</h1>
        <span class="portal-tag">Employee Portal</span>
      </div>

      <div class="tab-row">
        <RouterLink to="/login" class="tab">Sign in</RouterLink>
        <button class="tab active">Sign up</button>
      </div>

      <h2>Create your account</h2>
      <p class="subtitle">Register to start submitting vacation requests</p>

      <div class="form">
        <div class="name-row">
          <div class="field">
            <label for="name">Full name</label>
            <InputText
              id="name"
              v-model="name"
              placeholder="Alice Martin"
              :class="{ 'p-invalid': errors.name }"
              fluid
            />
            <small v-if="errors.name" class="error">{{ errors.name }}</small>
          </div>
        </div>

        <div class="field">
          <label for="email">Work email</label>
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
            placeholder="Min 8 characters"
            :feedback="true"
            :class="{ 'p-invalid': errors.password }"
            fluid
            toggleMask
          />
          <small v-if="errors.password" class="error">{{ errors.password }}</small>
        </div>

        <div class="field">
          <label for="confirmPassword">Confirm password</label>
          <Password
            id="confirmPassword"
            v-model="confirmPassword"
            placeholder="••••••••"
            :feedback="false"
            :class="{ 'p-invalid': errors.confirmPassword }"
            fluid
            toggleMask
          />
          <small v-if="errors.confirmPassword" class="error">{{ errors.confirmPassword }}</small>
        </div>

        <Button
          label="Create account"
          icon="pi pi-user-plus"
          :loading="loading"
          :disabled="loading"
          @click="handleRegister"
          fluid
        />
      </div>

      <p class="switch-text">
        Already registered?
        <RouterLink to="/login">Sign in here</RouterLink>
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
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04), 0 12px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--p-surface-200);
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
}

.login-header {
  text-align: center;
  margin-bottom: 28px;
}

.login-header i {
  font-size: 36px;
  color: var(--p-primary-500);
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
  background: var(--p-primary-100);
  color: var(--p-primary-700);
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
  color: var(--p-primary-500);
  border-bottom: 2px solid var(--p-primary-500);
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

.name-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
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
  color: var(--p-primary-500);
  text-decoration: none;
  font-weight: 500;
}
</style>