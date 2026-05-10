<script setup lang="ts">
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import { RequestStatus, VacationRequest } from '@org/shared';
import { getStatusSeverity, formatDate, getDayCount } from '../utils/formatters';

defineProps<{
  requests: VacationRequest[];
  selectedIds: string[];
}>();

const emit = defineEmits<{
  'toggle-select': [id: string];
  approve: [id: string];
  'open-reject': [id: string];
}>();

const initials = (name: string): string =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase();
</script>

<template>
  <div class="table-wrap">
    <table class="req-table">
      <thead>
        <tr>
          <th></th>
          <th>{{ $t('table.employee') }}</th>
          <th>{{ $t('table.dates') }}</th>
          <th>{{ $t('table.days') }}</th>
          <th>{{ $t('table.reason') }}</th>
          <th>{{ $t('table.submitted') }}</th>
          <th>{{ $t('table.status') }}</th>
          <th>{{ $t('table.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="request in requests"
          :key="request.id"
          :class="{ 'selected-row': selectedIds.includes(request.id) }"
        >
          <td>
            <input
              type="checkbox"
              :checked="selectedIds.includes(request.id)"
              @change="emit('toggle-select', request.id)"
            />
          </td>
          <td>
            <div class="table-emp">
              <div class="emp-avatar-sm">{{ initials(request.user.name) }}</div>
              {{ request.user.name }}
            </div>
          </td>
          <td>{{ formatDate(request.startDate) }} – {{ formatDate(request.endDate) }}</td>
          <td>{{ getDayCount(request.startDate, request.endDate) }}</td>
          <td>{{ request.reason || '—' }}</td>
          <td>{{ formatDate(request.createdAt) }}</td>
          <td>
            <Tag :value="$t(`status.${request.status.toLowerCase()}`)" :severity="getStatusSeverity(request.status)" />
          </td>
          <td>
            <div v-if="request.status === RequestStatus.PENDING" class="action-row">
              <Button
                icon="pi pi-check"
                severity="success"
                size="small"
                text
                :tooltip="$t('request.approve')"
                :tooltipOptions="{ position: 'top' }"
                @click="emit('approve', request.id)"
              />
              <Button
                icon="pi pi-times"
                severity="danger"
                size="small"
                text
                :tooltip="$t('request.reject')"
                :tooltipOptions="{ position: 'top' }"
                @click="emit('open-reject', request.id)"
              />
            </div>
            <span v-else class="actioned-label">{{ $t('table.actioned') }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-wrap {
  background: var(--p-surface-0);
  border-radius: 10px;
  border: 1px solid var(--p-surface-200);
  overflow: hidden;
}

.req-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.req-table th {
  padding: 10px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: var(--p-text-muted-color);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: var(--p-surface-50);
  border-bottom: 1px solid var(--p-surface-200);
}

.req-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--p-surface-100);
  color: var(--p-text-color);
}

.req-table tr:last-child td {
  border-bottom: none;
}

.selected-row {
  background: var(--p-primary-50);
}

.table-emp {
  display: flex;
  align-items: center;
  gap: 8px;
}

.emp-avatar-sm {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--p-primary-100);
  color: var(--p-primary-700);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.action-row {
  display: flex;
  gap: 6px;
}

.actioned-label {
  font-size: 11px;
  color: var(--p-text-muted-color);
}
</style>
