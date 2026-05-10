<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import DatePicker from 'primevue/datepicker';
import { RequestStatus } from '@org/shared';

interface FilterStats {
  pending: number;
  approved: number;
  rejected: number;
}

const props = defineProps<{
  activeFilter: RequestStatus | null;
  startDateFilter: Date | null;
  endDateFilter: Date | null;
  stats: FilterStats;
}>();

const emit = defineEmits<{
  'update:activeFilter': [value: RequestStatus | null];
  'update:startDateFilter': [value: Date | null];
  'update:endDateFilter': [value: Date | null];
}>();

const { t } = useI18n();

const statuses = [RequestStatus.PENDING, RequestStatus.APPROVED, RequestStatus.REJECTED] as const;

const toggle = (status: RequestStatus): void => {
  emit('update:activeFilter', props.activeFilter === status ? null : status);
};
</script>

<template>
  <div class="mobile-filters">
    <div class="mobile-date-row">
      <DatePicker
        :modelValue="startDateFilter"
        @update:modelValue="emit('update:startDateFilter', $event as Date | null)"
        :placeholder="t('sidebar.fromDate')"
        dateFormat="yy-mm-dd"
        showIcon
        fluid
        class="mobile-date-picker"
      />
      <DatePicker
        :modelValue="endDateFilter"
        @update:modelValue="emit('update:endDateFilter', $event as Date | null)"
        :placeholder="t('sidebar.toDate')"
        dateFormat="yy-mm-dd"
        showIcon
        fluid
        class="mobile-date-picker"
      />
    </div>
    <div class="chips-row">
      <button
        v-for="status in statuses"
        :key="status"
        class="filter-chip"
        :class="[`chip-${status.toLowerCase()}`, { active: activeFilter === status }]"
        @click="toggle(status)"
      >
        {{ t(`status.${status.toLowerCase()}`) }}
        <span class="chip-count">{{ stats[status.toLowerCase() as keyof FilterStats] }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.mobile-filters {
  display: none;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  border: 1.5px solid transparent;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  flex-shrink: 0;
}

.chip-count {
  font-size: 10px;
  font-weight: 600;
  opacity: 0.65;
}

.filter-chip.active .chip-count {
  opacity: 1;
}

.chip-pending {
  background: var(--p-orange-50);
  color: var(--p-orange-700);
  border-color: var(--p-orange-200);
}
.chip-pending.active {
  background: var(--p-orange-400);
  color: #fff;
  border-color: var(--p-orange-400);
}

.chip-approved {
  background: var(--p-green-50);
  color: var(--p-green-700);
  border-color: var(--p-green-200);
}
.chip-approved.active {
  background: var(--p-green-500);
  color: #fff;
  border-color: var(--p-green-500);
}

.chip-rejected {
  background: var(--p-red-50);
  color: var(--p-red-700);
  border-color: var(--p-red-200);
}
.chip-rejected.active {
  background: var(--p-red-500);
  color: #fff;
  border-color: var(--p-red-500);
}

@media (max-width: 768px) {
  .mobile-filters {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .mobile-date-row {
    display: flex;
    gap: 8px;
  }

  .mobile-date-picker {
    flex: 1;
    font-size: 12px;
    min-width: 0;
  }

  .chips-row {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding: 2px 0 4px;
    scrollbar-width: none;
  }

  .chips-row::-webkit-scrollbar {
    display: none;
  }
}
</style>
