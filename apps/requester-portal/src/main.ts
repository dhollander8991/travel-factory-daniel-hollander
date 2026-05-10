import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import 'primeicons/primeicons.css';
import './styles.css';
import App from './app/App.vue';
import { createAppRouter } from './router';
import en from './i18n/en';
import fr from './i18n/fr';

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('language') ?? 'en',
  fallbackLocale: 'en',
  messages: { en, fr },
});

const app = createApp(App);
const router = createAppRouter();

app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
  ripple: true,
});

app.use(i18n);
app.use(ToastService);
app.use(ConfirmationService);
app.use(router);
app.mount('#root');
