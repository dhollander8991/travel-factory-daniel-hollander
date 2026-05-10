<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import Select from 'primevue/select';

const props = defineProps<{
  userName: string;
  searchQuery: string;
  selectedSort: string;
}>();

const emit = defineEmits<{
  'update:searchQuery': [value: string];
  'update:selectedSort': [value: string];
  logout: [];
}>();

const { t, locale } = useI18n();
const searchExpanded = ref(false);

const localSearch = ref(props.searchQuery);
watch(() => props.searchQuery, (val) => { localSearch.value = val; });

const handleSearchInput = (e: Event): void => {
  const val = (e.target as HTMLInputElement).value;
  localSearch.value = val;
  emit('update:searchQuery', val);
};

const sortModel = computed({
  get: () => props.selectedSort,
  set: (val: string) => emit('update:selectedSort', val),
});

const sortOptions = computed(() => [
  { label: t('nav.sort.newest'), value: 'newest' },
  { label: t('nav.sort.oldest'), value: 'oldest' },
  { label: t('nav.sort.duration'), value: 'duration' },
]);

const toggleLanguage = (): void => {
  locale.value = locale.value === 'en' ? 'fr' : 'en';
  localStorage.setItem('language', locale.value);
  // TODO: chatbot — pass locale.value as the language for the system prompt
};
</script>

<template>
  <nav class="nav">
    <div class="nav-brand" :class="{ 'brand-hidden': searchExpanded }">
      <i class="pi pi-shield" />
      <span>{{ $t('nav.brand') }}</span>
      <span class="manager-tag">{{ $t('nav.managerBadge') }}</span>
    </div>

    <div class="search-bar" :class="{ 'search-expanded': searchExpanded }">
      <i class="pi pi-search search-icon" @click="searchExpanded = true" />
      <input
        :value="localSearch"
        type="text"
        :placeholder="t('nav.searchPlaceholder')"
        class="search-input"
        @input="handleSearchInput"
      />
      <div class="search-divider" />
      <Select
        v-model="sortModel"
        :options="sortOptions"
        optionLabel="label"
        optionValue="value"
        class="search-select"
      />
      <button class="search-close" @click="searchExpanded = false">
        <i class="pi pi-times" />
      </button>
    </div>

    <div class="nav-right">
      <span class="user-name">{{ userName }}</span>
      <Button
        :label="locale === 'en' ? 'EN' : 'FR'"
        text
        rounded
        @click="toggleLanguage"
      />
      <Button
        icon="pi pi-sign-out"
        text
        rounded
        :tooltip="t('nav.logout')"
        :tooltipOptions="{ position: 'top' }"
        @click="emit('logout')"
      />
    </div>
  </nav>
</template>

<style scoped>
.nav {
  background: var(--p-surface-0);
  border-bottom: 1px solid var(--p-surface-200);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 15px;
  flex-shrink: 0;
  letter-spacing: -0.01em;
}

.nav-brand i {
  color: var(--p-green-500);
  font-size: 20px;
}

.manager-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 20px;
  background: var(--p-green-100);
  color: var(--p-green-700);
  font-weight: 500;
}

.search-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--p-surface-100);
  border: 1px solid var(--p-surface-300);
  border-radius: 8px;
  padding: 0 12px;
  height: 36px;
}

.search-bar i {
  color: var(--p-text-muted-color);
  font-size: 15px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  box-shadow: none;
  padding: 0;
  font-size: 13px;
  outline: none;
  color: var(--p-text-color);
  min-width: 0;
}

.search-input::placeholder {
  color: var(--p-text-muted-color);
}

.search-divider {
  width: 1px;
  height: 16px;
  background: var(--p-surface-300);
}

.search-select {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  font-size: 12px;
}

.search-close {
  display: none;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--p-text-muted-color);
  padding: 0;
  line-height: 1;
  align-items: center;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.user-name {
  font-size: 13px;
  color: var(--p-text-muted-color);
}

@media (max-width: 768px) {
  .nav {
    padding: 0 16px;
    gap: 8px;
    min-height: 52px;
    justify-content: space-between;
  }

  .nav-brand {
    font-size: 14px;
  }

  .user-name {
    display: none;
  }

  .nav-brand.brand-hidden {
    display: none;
  }

  .search-bar {
    display: none;
  }

  .manager-tag {
    display: none;
  }
}
</style>
