<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import { RequestStatus } from '@org/shared';
import { getStatusSeverity } from '../utils/formatters';

interface SidebarStats {
  pending: number;
  approved: number;
  rejected: number;
}

const props = defineProps<{
  activeFilter: RequestStatus | null;
  selectedSort: string;
  startDateFilter: Date | null;
  endDateFilter: Date | null;
  stats: SidebarStats;
}>();

const emit = defineEmits<{
  'update:activeFilter': [value: RequestStatus | null];
  'update:selectedSort': [value: string];
  'update:startDateFilter': [value: Date | null];
  'update:endDateFilter': [value: Date | null];
}>();

const { t } = useI18n();

const sortOptions = computed(() => [
  { label: t('sidebar.sort.newest'), value: 'newest' },
  { label: t('sidebar.sort.oldest'), value: 'oldest' },
  { label: t('sidebar.sort.duration'), value: 'duration' },
]);

const toggleFilter = (status: RequestStatus): void => {
  emit('update:activeFilter', props.activeFilter === status ? null : status);
};

const clearFilters = (): void => {
  emit('update:activeFilter', null);
  emit('update:selectedSort', 'newest');
  emit('update:startDateFilter', null);
  emit('update:endDateFilter', null);
};
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-section">
      <h4>{{ $t('sidebar.statusSection') }}</h4>
      <div
        v-for="status in [RequestStatus.PENDING, RequestStatus.APPROVED, RequestStatus.REJECTED]"
        :key="status"
        class="filter-option"
        :class="{ active: activeFilter === status }"
        @click="toggleFilter(status)"
      >
        <Tag :value="$t(`status.${status.toLowerCase()}`)" :severity="getStatusSeverity(status)" />
        <span class="filter-count">
          {{ stats[status.toLowerCase() as keyof SidebarStats] }}
        </span>
      </div>
    </div>

    <div class="sidebar-section">
      <h4>{{ $t('sidebar.dateRangeSection') }}</h4>
      <div class="date-range">
        <DatePicker
          :modelValue="startDateFilter"
          @update:modelValue="emit('update:startDateFilter', $event as Date | null)"
          :placeholder="$t('sidebar.fromDate')"
          dateFormat="yy-mm-dd"
          showIcon
          fluid
          class="date-picker"
        />
        <DatePicker
          :modelValue="endDateFilter"
          @update:modelValue="emit('update:endDateFilter', $event as Date | null)"
          :placeholder="$t('sidebar.toDate')"
          dateFormat="yy-mm-dd"
          showIcon
          fluid
          class="date-picker"
        />
      </div>
    </div>

    <div class="sidebar-section">
      <h4>{{ $t('sidebar.sortBySection') }}</h4>
      <Select
        :modelValue="selectedSort"
        @update:modelValue="emit('update:selectedSort', $event as string)"
        :options="sortOptions"
        optionLabel="label"
        optionValue="value"
        fluid
      />
    </div>

    <Button
      :label="$t('sidebar.clearFilters')"
      text
      size="small"
      @click="clearFilters"
    />
  </aside>
</template>

<style scoped>
.sidebar {
  background: var(--p-surface-0);
  border-right: 1px solid var(--p-surface-200);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sidebar-section h4 {
  font-size: 10px;
  font-weight: 700;
  color: var(--p-text-muted-color);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
}

.date-range {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.date-picker {
  font-size: 12px;
}

.filter-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 2px;
  transition: background 0.15s ease;
}

.filter-option:hover {
  background: var(--p-surface-100);
}

.filter-option.active {
  background: var(--p-primary-50);
  box-shadow: inset 0 0 0 1px var(--p-primary-200);
}

.filter-count {
  font-size: 11px;
  font-weight: 600;
  color: var(--p-text-muted-color);
  background: var(--p-surface-100);
  padding: 1px 7px;
  border-radius: 20px;
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
}
</style>
