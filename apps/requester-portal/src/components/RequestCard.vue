<script setup lang="ts">
import Tag from 'primevue/tag';
import { RequestStatus, VacationRequest } from '@org/shared';
import { getStatusSeverity, formatDate, getDayCount } from '../utils/formatters';

defineProps<{
  request: VacationRequest;
}>();
</script>

<template>
  <div
    class="req-card"
    :class="{ 'pending-card': request.status === RequestStatus.PENDING }"
  >
    <div
      class="req-card-icon"
      :class="`icon-${request.status.toLowerCase()}`"
    >
      <i
        :class="{
          'pi pi-clock': request.status === RequestStatus.PENDING,
          'pi pi-check': request.status === RequestStatus.APPROVED,
          'pi pi-times': request.status === RequestStatus.REJECTED,
        }"
      />
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
        <i class="pi pi-info-circle" />
        {{ request.comments }}
      </div>
    </div>

    <div class="req-card-right">
      <Tag :value="$t(`status.${request.status.toLowerCase()}`)" :severity="getStatusSeverity(request.status)" />
    </div>
  </div>
</template>

<style scoped>
.req-card {
  background: var(--p-surface-0);
  border-radius: 10px;
  border: 1px solid var(--p-surface-200);
  padding: 16px;
  display: grid;
  grid-template-columns: 40px 1fr auto;
  gap: 14px;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.req-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.req-card.pending-card {
  border-left: 4px solid var(--p-orange-400);
}

.req-card-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.icon-pending {
  background: var(--p-orange-50);
  color: var(--p-orange-500);
}

.icon-approved {
  background: var(--p-green-50);
  color: var(--p-green-500);
}

.icon-rejected {
  background: var(--p-red-50);
  color: var(--p-red-500);
}

.req-card-dates {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.req-card-reason {
  font-size: 12px;
  color: var(--p-text-muted-color);
  margin-top: 3px;
}

.req-card-meta {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 11px;
  color: var(--p-text-muted-color);
  opacity: 0.8;
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

.req-card-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
</style>
