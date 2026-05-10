<script setup lang="ts">
import Tag from 'primevue/tag';
import { RequestStatus, VacationRequest } from '@org/shared';
import { getStatusSeverity, formatDate, getDayCount } from '../utils/formatters';

defineProps<{
  requests: VacationRequest[];
}>();
</script>

<template>
  <div class="table-wrap">
    <table class="req-table">
      <thead>
        <tr>
          <th>{{ $t('table.dates') }}</th>
          <th>{{ $t('table.duration') }}</th>
          <th>{{ $t('table.reason') }}</th>
          <th>{{ $t('table.submitted') }}</th>
          <th>{{ $t('table.status') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="request in requests" :key="request.id">
          <td>{{ formatDate(request.startDate) }} – {{ formatDate(request.endDate) }}</td>
          <td>{{ getDayCount(request.startDate, request.endDate) }} {{ $t('table.days') }}</td>
          <td>{{ request.reason || '—' }}</td>
          <td>{{ formatDate(request.createdAt) }}</td>
          <td>
            <Tag :value="$t(`status.${request.status.toLowerCase()}`)" :severity="getStatusSeverity(request.status)" />
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
</style>
