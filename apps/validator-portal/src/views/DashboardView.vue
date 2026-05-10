<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useAuthStore } from '../stores/authStore';
import { useRequests } from '../composables/useRequests';
import AppNav from '../components/AppNav.vue';
import StatsRow from '../components/StatsRow.vue';
import AppSidebar from '../components/AppSidebar.vue';
import BulkActionBar from '../components/BulkActionBar.vue';
import RequestCard from '../components/RequestCard.vue';
import RequestTable from '../components/RequestTable.vue';
import RejectDialog from '../components/RejectDialog.vue';
import ChatWidget from '../components/ChatWidget.vue';
import MobileFilters from '../components/MobileFilters.vue';

const router = useRouter();
const toast = useToast();
const { t } = useI18n();
const { user, clearAuth } = useAuthStore();

const {
  filteredRequests,
  loading,
  activeFilter,
  searchQuery,
  selectedEmployee,
  selectedSort,
  startDateFilter,
  endDateFilter,
  selectedIds,
  selectedRequests,
  canBulkReject,
  allSelectedPending,
  stats,
  employees,
  fetchRequests,
  approveRequest,
  rejectRequest,
  bulkApprove,
  bulkReject,
  toggleSelect,
  clearSelection,
  startPolling,
  stopPolling,
} = useRequests();

const viewMode = ref<'cards' | 'table'>(
  (localStorage.getItem('validator-view-mode') as 'cards' | 'table') || 'cards'
);

watch(viewMode, (newVal) => {
  localStorage.setItem('validator-view-mode', newVal);
});

const windowWidth = ref(window.innerWidth);
const onResize = () => { windowWidth.value = window.innerWidth; };
const isMobile = computed(() => windowWidth.value <= 768);
const effectiveViewMode = computed(() => isMobile.value ? 'cards' : viewMode.value);

// ─── Reject dialog state ───
const showRejectDialog = ref<boolean>(false);
const rejectingRequestId = ref<string | null>(null);
const isBulkReject = ref<boolean>(false);
const rejectLoading = ref<boolean>(false);

onMounted(() => {
  fetchRequests();
  startPolling();
  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  stopPolling();
  window.removeEventListener('resize', onResize);
});

const openRejectDialog = (requestId: string): void => {
  rejectingRequestId.value = requestId;
  isBulkReject.value = false;
  showRejectDialog.value = true;
};

const openBulkRejectDialog = (): void => {
  rejectingRequestId.value = null;
  isBulkReject.value = true;
  showRejectDialog.value = true;
};

const handleApprove = async (requestId: string): Promise<void> => {
  try {
    await approveRequest({ requestId });
    toast.add({
      severity: 'success',
      summary: t('toast.approved'),
      detail: t('toast.approvedDetail'),
      life: 3000,
    });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('toast.error'),
      detail: error.response?.data?.error?.message || t('toast.failedApprove'),
      life: 5000,
    });
  }
};

const handleBulkApprove = async (): Promise<void> => {
  try {
    const count = selectedRequests.value.length;
    await bulkApprove();
    toast.add({
      severity: 'success',
      summary: t('toast.approvedBulk'),
      detail: t('toast.approvedBulkDetail', { count }),
      life: 3000,
    });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('toast.error'),
      detail: error.response?.data?.error?.message || t('toast.failedApproveAll'),
      life: 5000,
    });
  }
};

const handleConfirmReject = async (comment: string): Promise<void> => {
  rejectLoading.value = true;

  try {
    if (isBulkReject.value) {
      const count = selectedRequests.value.length;
      await bulkReject({ comments: comment });
      toast.add({
        severity: 'success',
        summary: t('toast.rejectedBulk'),
        detail: t('toast.rejectedBulkDetail', { count }),
        life: 3000,
      });
    } else {
      await rejectRequest({ requestId: rejectingRequestId.value!, comments: comment });
      toast.add({
        severity: 'success',
        summary: t('toast.rejected'),
        detail: t('toast.rejectedDetail'),
        life: 3000,
      });
    }

    showRejectDialog.value = false;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('toast.error'),
      detail: error.response?.data?.error?.message || t('toast.failedReject'),
      life: 5000,
    });
  } finally {
    rejectLoading.value = false;
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
      v-model:selectedSort="selectedSort"
      @logout="logout"
    />

    <div class="body">
      <AppSidebar
        v-if="!isMobile"
        v-model:activeFilter="activeFilter"
        v-model:selectedEmployee="selectedEmployee"
        v-model:startDateFilter="startDateFilter"
        v-model:endDateFilter="endDateFilter"
        :stats="stats"
        :employees="employees"
      />

      <main class="main">
        <StatsRow :stats="stats" />

        <MobileFilters
          v-model:activeFilter="activeFilter"
          v-model:selectedEmployee="selectedEmployee"
          v-model:searchQuery="searchQuery"
          v-model:selectedSort="selectedSort"
          v-model:startDateFilter="startDateFilter"
          v-model:endDateFilter="endDateFilter"
          :stats="stats"
          :employees="employees"
        />

        <BulkActionBar
          v-if="selectedIds.length > 0"
          :selectedCount="selectedIds.length"
          :allSelectedPending="allSelectedPending"
          :canBulkReject="canBulkReject"
          @clear="clearSelection"
          @bulk-approve="handleBulkApprove"
          @open-bulk-reject="openBulkRejectDialog"
        />

        <!-- Toolbar -->
        <div class="toolbar">
          <div>
            <p class="toolbar-title">{{ $t('dashboard.title') }}</p>
            <span class="toolbar-sub">{{ $t('dashboard.subtitle', { count: filteredRequests.length, pending: stats.pending }) }}</span>
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
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="empty-state">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem" />
          <p>{{ $t('dashboard.loading') }}</p>
        </div>

        <!-- Empty state -->
        <div v-else-if="filteredRequests.length === 0" class="empty-state">
          <i class="pi pi-inbox" style="font-size: 2rem; opacity: 0.3" />
          <p>{{ $t('dashboard.empty') }}</p>
        </div>

        <!-- Card view -->
        <div v-else-if="effectiveViewMode === 'cards'" class="cards">
          <RequestCard
            v-for="request in filteredRequests"
            :key="request.id"
            :request="request"
            :selected="selectedIds.includes(request.id)"
            @toggle-select="toggleSelect"
            @approve="handleApprove"
            @open-reject="openRejectDialog"
          />
        </div>

        <!-- Table view -->
        <RequestTable
          v-else
          :requests="filteredRequests"
          :selectedIds="selectedIds"
          @toggle-select="toggleSelect"
          @approve="handleApprove"
          @open-reject="openRejectDialog"
        />
      </main>
    </div>

    <RejectDialog
      v-model:visible="showRejectDialog"
      :isBulk="isBulkReject"
      :selectedRequests="selectedRequests"
      :submitting="rejectLoading"
      @confirm="handleConfirmReject"
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

  .toolbar {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>

