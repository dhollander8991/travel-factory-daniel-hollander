<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';

const props = defineProps<{
  userName: string;
  searchQuery: string;
}>();

const emit = defineEmits<{
  'update:searchQuery': [value: string];
  logout: [];
}>();

const { t, locale } = useI18n();
const searchExpanded = ref(false);
const searchInputRef = ref<HTMLInputElement | null>(null);

const localSearch = ref(props.searchQuery);
watch(() => props.searchQuery, (val) => { localSearch.value = val; });

const handleSearchInput = (e: Event): void => {
  const val = (e.target as HTMLInputElement).value;
  localSearch.value = val;
  emit('update:searchQuery', val);
};

const expandSearch = (): void => {
  searchExpanded.value = true;
  nextTick(() => searchInputRef.value?.focus());
};

const toggleLanguage = (): void => {
  locale.value = locale.value === 'en' ? 'fr' : 'en';
  localStorage.setItem('language', locale.value);
  // TODO: chatbot — pass locale.value as the language for the system prompt
};
</script>

<template>
  <nav class="nav">
    <div class="nav-brand" :class="{ 'brand-hidden': searchExpanded }">
      <i class="pi pi-sun" />
      <span>{{ $t('nav.brand') }}</span>
    </div>

    <div class="search-bar" :class="{ 'search-expanded': searchExpanded }">
      <i class="pi pi-search search-icon" @click="expandSearch" />
      <input
        ref="searchInputRef"
        :value="localSearch"
        type="text"
        :placeholder="t('nav.searchPlaceholder')"
        class="search-input"
        @input="handleSearchInput"
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
  color: var(--p-primary-500);
  font-size: 20px;
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
    flex: 0;
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 0 4px;
    width: auto;
  }

  .search-bar .search-input {
    display: none;
  }

  .search-icon {
    cursor: pointer;
  }

  .search-bar.search-expanded {
    position: absolute;
    inset: 0;
    z-index: 10;
    flex: unset;
    background: var(--p-surface-0);
    border: none;
    border-radius: 0;
    border-bottom: 1px solid var(--p-surface-200);
    padding: 0 16px;
    gap: 12px;
  }

  .search-bar.search-expanded .search-input {
    display: block;
  }

  .search-bar.search-expanded .search-close {
    display: flex;
  }
}
</style>
