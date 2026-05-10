<script setup lang="ts">
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import { RequestStatus, VacationRequest } from '@org/shared';
import { getStatusSeverity, formatDate, getDayCount } from '../utils/formatters';

defineProps<{
  request: VacationRequest;
  selected: boolean;
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
  <div
    class="req-card"
    :class="{
      'pending-card': request.status === RequestStatus.PENDING,
      selected,
    }"
  >
    <div class="req-card-top">
      <input
        type="checkbox"
        class="card-checkbox"
        :checked="selected"
        @change="emit('toggle-select', request.id)"
      />
      <div class="emp-avatar-sm">{{ initials(request.user.name) }}</div>
      <div class="req-card-name">{{ request.user.name }}</div>
    </div>

    <div class="req-card-body">
      <div class="req-card-dates">
        {{ formatDate(request.startDate) }} – {{ formatDate(request.endDate) }}
      </div>
      <div class="req-card-reason">{{ request.reason || '—' }}</div>
      <div class="req-card-meta">
        <span><i class="pi pi-calendar" /> {{ getDayCount(request.startDate, request.endDate) }} {{ $t('request.days') }}</span>
        <span><i class="pi pi-clock" /> {{ $t('request.submitted') }} {{ formatDate(request.createdAt) }}</span>
      </div>
      <div v-if="request.comments" class="rejection-note">
        <i class="pi pi-info-circle" /> {{ request.comments }}
      </div>
    </div>

    <div class="req-card-right">
      <Tag :value="$t(`status.${request.status.toLowerCase()}`)" :severity="getStatusSeverity(request.status)" />
      <div v-if="request.status === RequestStatus.PENDING" class="action-row">
        <Button
          :label="$t('request.approve')"
          icon="pi pi-check"
          severity="success"
          size="small"
          @click="emit('approve', request.id)"
        />
        <Button
          :label="$t('request.reject')"
          icon="pi pi-times"
          severity="danger"
          size="small"
          @click="emit('open-reject', request.id)"
        />
      </div>
      <span v-else class="actioned-label">{{ $t('request.actioned') }}</span>
    </div>
  </div>
</template>

<style scoped>
/* ── Desktop: 2-column grid, left stacks top+body, right spans both rows ── */

.req-card {
  background: var(--p-surface-0);
  border-radius: 10px;
  border: 1px solid var(--p-surface-200);
  padding: 14px 16px;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  column-gap: 16px;
  row-gap: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.15s ease;
}

.req-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.req-card.pending-card {
  border-left: 4px solid var(--p-orange-400);
  background: color-mix(in srgb, var(--p-orange-50) 50%, var(--p-surface-0));
}

.req-card.selected {
  border: 1.5px solid var(--p-primary-400);
  background: var(--p-primary-50);
}

.req-card-top {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.req-card-body {
  grid-column: 1;
  grid-row: 2;
}

.req-card-right {
  grid-column: 2;
  grid-row: 1 / 3;
  align-self: center;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

/* ── Shared ──────────────────────────────────────── */

.card-checkbox {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  cursor: pointer;
  accent-color: var(--p-primary-500);
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

.req-card-name {
  font-size: 13px;
  font-weight: 500;
}

.req-card-dates {
  font-size: 13px;
  color: var(--p-text-muted-color);
  margin-top: 2px;
}

.req-card-reason {
  font-size: 12px;
  color: var(--p-text-muted-color);
}

.req-card-meta {
  display: flex;
  gap: 16px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--p-text-muted-color);
}

.req-card-meta i {
  font-size: 12px;
  margin-right: 3px;
}

.rejection-note {
  margin-top: 6px;
  font-size: 12px;
  color: var(--p-red-500);
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-row {
  display: flex;
  gap: 6px;
}

.actioned-label {
  font-size: 11px;
  color: var(--p-text-muted-color);
}

/* ── Mobile: pure flexbox column, no grid-template-areas ─── */

@media (max-width: 768px) {
  .req-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
  }

  .req-card-top {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .req-card-right {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid var(--p-surface-100);
    padding-top: 8px;
    grid-column: unset;
    grid-row: unset;
  }

  .action-row :deep(.p-button-label) {
    display: none;
  }
}
</style>
