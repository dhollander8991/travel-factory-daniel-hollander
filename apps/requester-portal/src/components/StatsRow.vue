<script setup lang="ts">
interface Stats {
  totalDays: number;
  pending: number;
  total: number;
}

defineProps<{
  stats: Stats;
}>();
</script>

<template>
  <div class="stats-row">
    <div class="stat">
      <div class="stat-label">{{ $t('stats.totalDays') }}</div>
      <div class="stat-val">{{ stats.totalDays }}</div>
    </div>
    <div class="stat">
      <div class="stat-label">{{ $t('stats.pendingApproval') }}</div>
      <div class="stat-val warn">{{ $t('stats.pendingValue', { count: stats.pending }) }}</div>
    </div>
    <div class="stat">
      <div class="stat-label">{{ $t('stats.requestsThisYear') }}</div>
      <div class="stat-val">{{ stats.total }}</div>
    </div>
  </div>
</template>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
}

.stat {
  background: var(--p-surface-0);
  border-radius: 10px;
  padding: 14px 16px;
  border: 1px solid var(--p-surface-200);
  border-left: 3px solid var(--p-primary-300);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.15s ease;
}

.stat:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* totalDays → primary blue accent */
.stat:nth-child(1) { border-left-color: var(--p-primary-400); }
/* pending approval → orange accent */
.stat:nth-child(2) { border-left-color: var(--p-orange-400); }
/* requests this year → neutral blue */
.stat:nth-child(3) { border-left-color: var(--p-primary-300); }

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

.stat-val.warn {
  color: var(--p-orange-500);
}
</style>
