<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Select from 'primevue/select';
import { useAuthStore } from '../stores/authStore';
import { useVacations } from '../composables/useVacations';
import AppNav from '../components/AppNav.vue';
import StatsRow from '../components/StatsRow.vue';
import AppSidebar from '../components/AppSidebar.vue';
import RequestCard from '../components/RequestCard.vue';
import RequestTable from '../components/RequestTable.vue';
import NewRequestDialog from '../components/NewRequestDialog.vue';
import ChatWidget from '../components/ChatWidget.vue';
import MobileFilters from '../components/MobileFilters.vue';
import { formatDate } from '../utils/formatters';

const router = useRouter();
const toast = useToast();
const { t } = useI18n();
const { user, clearAuth } = useAuthStore();

const {
  filteredRequests,
  loading,
  activeFilter,
  searchQuery,
  selectedSort,
  startDateFilter,
  endDateFilter,
  stats,
  fetchRequests,
  submitRequest,
  startPolling,
  stopPolling,
} = useVacations(user.value!.id);

const viewMode = ref<'cards' | 'table'>(
  (localStorage.getItem('requester-view-mode') as 'cards' | 'table') || 'cards'
);

watch(viewMode, (newVal) => {
  localStorage.setItem('requester-view-mode', newVal);
});

const showNewRequestDialog = ref<boolean>(false);
const submitting = ref<boolean>(false);
const serverErrors = ref<Record<string, string>>({});

const windowWidth = ref(window.innerWidth);
const onResize = () => { windowWidth.value = window.innerWidth; };
const isMobile = computed(() => windowWidth.value <= 768);
const effectiveViewMode = computed(() => isMobile.value ? 'cards' : viewMode.value);

const sortOptions = computed(() => [
  { label: t('sidebar.sort.newest'), value: 'newest' },
  { label: t('sidebar.sort.oldest'), value: 'oldest' },
  { label: t('sidebar.sort.duration'), value: 'duration' },
]);

onMounted(() => {
  fetchRequests();
  startPolling();
  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  stopPolling();
  window.removeEventListener('resize', onResize);
});

const handleSubmit = async (data: { startDate: string; endDate: string; reason?: string }): Promise<void> => {
  submitting.value = true;
  serverErrors.value = {};

  try {
    await submitRequest(data);
    toast.add({
      severity: 'success',
      summary: t('toast.submitted'),
      detail: t('toast.submittedDetail', { from: formatDate(data.startDate), to: formatDate(data.endDate) }),
      life: 5000,
    });
    showNewRequestDialog.value = false;
  } catch (error: any) {
    const message = error.response?.data?.error?.message;
    const field = error.response?.data?.error?.field;

    if (field) {
      serverErrors.value = { [field]: message };
    } else {
      toast.add({
        severity: 'error',
        summary: t('toast.submitFailed'),
        detail: message || t('toast.failedToSubmit'),
        life: 5000,
      });
    }
  } finally {
    submitting.value = false;
  }
};

const logout = (): void => {
  clearAuth();
  router.push({ name: 'login' });
};
</script>

<template>
  <div class="portal">
    <AppNav
      :userName="user?.name ?? ''"
      v-model:searchQuery="searchQuery"
      @logout="logout"
    />

    <div class="body">
      <AppSidebar
        v-model:activeFilter="activeFilter"
        v-model:selectedSort="selectedSort"
        v-model:startDateFilter="startDateFilter"
        v-model:endDateFilter="endDateFilter"
        :stats="stats"
      />

      <main class="main">
        <StatsRow :stats="stats" />

        <MobileFilters
          v-model:activeFilter="activeFilter"
          v-model:startDateFilter="startDateFilter"
          v-model:endDateFilter="endDateFilter"
          :stats="stats"
        />

        <!-- Toolbar -->
        <div class="toolbar">
          <div>
            <p class="toolbar-title">{{ $t('dashboard.title') }}</p>
            <span class="toolbar-sub">{{ $t('dashboard.requestsFound', { count: filteredRequests.length }) }}</span>
          </div>
          <div class="toolbar-right">
            <div class="seg-control">
              <button
                class="seg-btn"
                :class="{ active: viewMode === 'cards' }"
                @click="viewMode = 'cards'"
              >
                <i class="pi pi-th-large" /> {{ $t('dashboard.cards') }}
              </button>
              <button
                class="seg-btn"
                :class="{ active: viewMode === 'table' }"
                @click="viewMode = 'table'"
              >
                <i class="pi pi-table" /> {{ $t('dashboard.table') }}
              </button>
            </div>
            <Select
              v-model="selectedSort"
              :options="sortOptions"
              optionLabel="label"
              optionValue="value"
              class="mobile-sort"
            />
            <Button
              :label="$t('dashboard.newRequest')"
              icon="pi pi-plus"
              @click="showNewRequestDialog = true"
            />
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="empty-state">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem" />
          <p>{{ $t('dashboard.loading') }}</p>
        </div>

        <!-- Empty state -->
        <div v-else-if="filteredRequests.length === 0" class="empty-state">
          <i class="pi pi-calendar" style="font-size: 2rem; opacity: 0.3" />
          <p>{{ $t('dashboard.empty') }}</p>
          <Button :label="$t('dashboard.submitFirst')" text @click="showNewRequestDialog = true" />
        </div>

        <!-- Card view -->
        <div v-else-if="effectiveViewMode === 'cards'" class="cards">
          <RequestCard
            v-for="request in filteredRequests"
            :key="request.id"
            :request="request"
          />
        </div>

        <!-- Table view -->
        <RequestTable v-else :requests="filteredRequests" />
      </main>
    </div>

    <NewRequestDialog
      v-model:visible="showNewRequestDialog"
      :submitting="submitting"
      :serverErrors="serverErrors"
      @submit="handleSubmit"
    />

    <ChatWidget />
  </div>
</template>

<style scoped>
.portal {
  width: 100%;
  min-height: 100vh;
  background: var(--p-surface-50);
}

.body {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: calc(100vh - 52px);
}

.main {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-x: hidden;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolbar-title {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.toolbar-sub {
  font-size: 12px;
  color: var(--p-text-muted-color);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.seg-control {
  display: flex;
  background: var(--p-surface-100);
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
}

.seg-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  padding: 5px 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  background: transparent;
  color: var(--p-text-muted-color);
}

.seg-btn.active {
  background: var(--p-surface-0);
  color: var(--p-text-color);
  font-weight: 500;
  box-shadow: 0 1px 3px var(--p-surface-200);
}

.mobile-sort {
  display: none;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 48px;
  gap: 16px;
  color: var(--p-text-muted-color);
  background: var(--p-surface-0);
  border-radius: 12px;
  border: 1px dashed var(--p-surface-300);
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (max-width: 768px) {
  .body {
    grid-template-columns: 1fr;
  }

  .main {
    padding: 12px;
  }

  .seg-control {
    display: none;
  }

  .mobile-sort {
    display: flex;
    font-size: 12px;
  }

  .toolbar {
    flex-wrap: wrap;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .toolbar-right {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
