<script setup lang="ts">
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import DatePicker from 'primevue/datepicker';
import { RequestStatus } from '@org/shared';
import { getStatusSeverity } from '../utils/formatters';

interface Employee {
  id: string;
  name: string;
}

interface SidebarStats {
  pending: number;
  approved: number;
  rejected: number;
}

const props = defineProps<{
  activeFilter: RequestStatus | null;
  selectedEmployee: string | null;
  startDateFilter: Date | null;
  endDateFilter: Date | null;
  stats: SidebarStats;
  employees: Employee[];
}>();

const emit = defineEmits<{
  'update:activeFilter': [value: RequestStatus | null];
  'update:selectedEmployee': [value: string | null];
  'update:startDateFilter': [value: Date | null];
  'update:endDateFilter': [value: Date | null];
}>();

const initials = (name: string): string =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase();

const toggleFilter = (status: RequestStatus): void => {
  emit('update:activeFilter', props.activeFilter === status ? null : status);
};

const toggleEmployee = (id: string): void => {
  emit('update:selectedEmployee', props.selectedEmployee === id ? null : id);
};

const clearFilters = (): void => {
  emit('update:activeFilter', null);
  emit('update:selectedEmployee', null);
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
        class="drop-zone"
        :class="`dz-${status.toLowerCase()}`"
        @click="toggleFilter(status)"
      >
        <div class="dz-header">
          <span class="dz-label">{{ $t(`status.${status.toLowerCase()}`) }}</span>
          <Tag
            :value="String(stats[status.toLowerCase() as keyof SidebarStats])"
            :severity="getStatusSeverity(status)"
          />
        </div>
        <div class="dz-hint">
          <i class="pi pi-filter" />
          {{ $t('sidebar.clickToFilter') }}
        </div>
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
      <h4>{{ $t('sidebar.employeeSection') }}</h4>
      <div class="emp-list">
        <div
          v-for="emp in employees"
          :key="emp.id"
          class="emp-item"
          :class="{ active: selectedEmployee === emp.id }"
          @click="toggleEmployee(emp.id)"
        >
          <div class="emp-avatar">{{ initials(emp.name) }}</div>
          <span>{{ emp.name }}</span>
        </div>
      </div>
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

.drop-zone {
  border-radius: 8px;
  border: 1.5px dashed;
  padding: 10px 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.dz-pending  { border-color: var(--p-orange-300); background: var(--p-orange-50); }
.dz-approved { border-color: var(--p-green-300);  background: var(--p-green-50); }
.dz-rejected { border-color: var(--p-red-300);    background: var(--p-red-50); }

.dz-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.dz-label {
  font-size: 12px;
  font-weight: 500;
}

.dz-hint {
  font-size: 11px;
  color: var(--p-text-muted-color);
  display: flex;
  align-items: center;
  gap: 4px;
}

.date-range {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.date-picker {
  font-size: 12px;
}

.emp-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.emp-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.15s ease;
}

.emp-item:hover { background: var(--p-surface-100); }

.emp-item.active {
  background: var(--p-green-50);
  color: var(--p-green-700);
  box-shadow: inset 0 0 0 1px var(--p-green-200);
}

.emp-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--p-green-100);
  color: var(--p-green-700);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
}
</style>
