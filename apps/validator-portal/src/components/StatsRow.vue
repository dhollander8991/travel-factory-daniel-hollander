<script setup lang="ts">
interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

defineProps<{
  stats: Stats;
}>();
</script>

<template>
  <div class="stats-row">
    <div class="stat">
      <div class="stat-label">{{ $t('stats.total') }}</div>
      <div class="stat-val">{{ stats.total }}</div>
    </div>
    <div class="stat">
      <div class="stat-label">{{ $t('stats.pendingReview') }}</div>
      <div class="stat-val warn">{{ stats.pending }}</div>
    </div>
    <div class="stat">
      <div class="stat-label">{{ $t('stats.approved') }}</div>
      <div class="stat-val success">{{ stats.approved }}</div>
    </div>
    <div class="stat">
      <div class="stat-label">{{ $t('stats.rejected') }}</div>
      <div class="stat-val danger">{{ stats.rejected }}</div>
    </div>
  </div>
</template>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  width: 100%;
}

@media (max-width: 768px) {
  .stats-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    box-sizing: border-box;
    width: 100%;
  }

  .stat {
    flex: 1 1 calc(50% - 4px);
    max-width: calc(50% - 4px);
    box-sizing: border-box;
    min-width: 0;
  }
}

.stat {
  background: var(--p-surface-0);
  border-radius: 10px;
  padding: 14px 16px;
  border: 1px solid var(--p-surface-200);
  border-left: 3px solid var(--p-primary-300);
  min-width: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.15s ease;
}

.stat:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* total → blue, pending → orange, approved → green, rejected → red */
.stat:nth-child(1) { border-left-color: var(--p-primary-400); }
.stat:nth-child(2) { border-left-color: var(--p-orange-400); }
.stat:nth-child(3) { border-left-color: var(--p-green-500); }
.stat:nth-child(4) { border-left-color: var(--p-red-500); }

.stat-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--p-text-muted-color);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stat-val {
  font-size: 24px;
  font-weight: 700;
  margin-top: 6px;
  letter-spacing: -0.02em;
}

.stat-val.warn    { color: var(--p-orange-500); }
.stat-val.success { color: var(--p-green-500); }
.stat-val.danger  { color: var(--p-red-500); }
</style>
