<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import { RequestStatus } from '@org/shared';

interface Employee {
  id: string;
  name: string;
}

interface FilterStats {
  pending: number;
  approved: number;
  rejected: number;
}

const props = defineProps<{
  activeFilter: RequestStatus | null;
  selectedEmployee: string | null;
  searchQuery: string;
  selectedSort: string;
  startDateFilter: Date | null;
  endDateFilter: Date | null;
  stats: FilterStats;
  employees: Employee[];
}>();

const emit = defineEmits<{
  'update:activeFilter': [value: RequestStatus | null];
  'update:selectedEmployee': [value: string | null];
  'update:searchQuery': [value: string];
  'update:selectedSort': [value: string];
  'update:startDateFilter': [value: Date | null];
  'update:endDateFilter': [value: Date | null];
}>();

const { t } = useI18n();

const statuses = [RequestStatus.PENDING, RequestStatus.APPROVED, RequestStatus.REJECTED] as const;

const sortOptions = computed(() => [
  { label: t('nav.sort.newest'), value: 'newest' },
  { label: t('nav.sort.oldest'), value: 'oldest' },
  { label: t('nav.sort.duration'), value: 'duration' },
]);

const toggleStatus = (status: RequestStatus): void => {
  emit('update:activeFilter', props.activeFilter === status ? null : status);
};

const toggleEmployee = (id: string): void => {
  emit('update:selectedEmployee', props.selectedEmployee === id ? null : id);
};
</script>

<template>
  <div class="mobile-filters">
    <!-- Search + sort row -->
    <div class="mobile-search-row">
      <div class="mobile-search-wrap">
        <i class="pi pi-search" />
        <input
          type="text"
          :value="searchQuery"
          @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          :placeholder="t('nav.searchPlaceholder')"
          class="mobile-search-input"
        />
      </div>
      <Select
        :modelValue="selectedSort"
        @update:modelValue="emit('update:selectedSort', $event as string)"
        :options="sortOptions"
        optionLabel="label"
        optionValue="value"
        class="mobile-sort-select"
      />
    </div>

    <!-- Date range row -->
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

    <!-- Scrollable filter chips -->
    <div class="chips-scroll">
      <button
        v-for="status in statuses"
        :key="status"
        class="filter-chip"
        :class="[`chip-${status.toLowerCase()}`, { active: activeFilter === status }]"
        @click="toggleStatus(status)"
      >
        {{ t(`status.${status.toLowerCase()}`) }}
        <span class="chip-count">{{ stats[status.toLowerCase() as keyof FilterStats] }}</span>
      </button>

      <div v-if="employees.length > 0" class="chip-divider" />

      <button
        v-for="emp in employees"
        :key="emp.id"
        class="filter-chip chip-employee"
        :class="{ active: selectedEmployee === emp.id }"
        @click="toggleEmployee(emp.id)"
      >
        {{ emp.name }}
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

.chip-employee {
  background: var(--p-surface-100);
  color: var(--p-text-color);
  border-color: var(--p-surface-300);
}
.chip-employee.active {
  background: var(--p-green-500);
  color: #fff;
  border-color: var(--p-green-500);
}

.chip-divider {
  display: inline-block;
  width: 1px;
  height: 18px;
  background: var(--p-surface-300);
  vertical-align: middle;
  margin: 0 4px;
}

@media (max-width: 768px) {
  .mobile-filters {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .mobile-search-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .mobile-search-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--p-surface-100);
    border: 1px solid var(--p-surface-300);
    border-radius: 8px;
    padding: 0 12px;
    height: 36px;
    min-width: 0;
  }

  .mobile-search-wrap i {
    color: var(--p-text-muted-color);
    font-size: 14px;
    flex-shrink: 0;
  }

  .mobile-search-input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font-size: 13px;
    color: var(--p-text-color);
    min-width: 0;
  }

  .mobile-search-input::placeholder {
    color: var(--p-text-muted-color);
  }

  .mobile-sort-select {
    flex-shrink: 0;
    font-size: 12px;
    height: 36px;
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

  .chips-scroll {
    display: block;
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    white-space: nowrap;
    scrollbar-width: none;
    padding: 2px 0 4px;
  }

  .chips-scroll::-webkit-scrollbar {
    display: none;
  }
}
</style>
