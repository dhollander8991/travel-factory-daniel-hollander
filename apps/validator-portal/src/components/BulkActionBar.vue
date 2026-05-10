<script setup lang="ts">
import Button from 'primevue/button';

defineProps<{
  selectedCount: number;
  allSelectedPending: boolean;
  canBulkReject: boolean;
}>();

const emit = defineEmits<{
  clear: [];
  'bulk-approve': [];
  'open-bulk-reject': [];
}>();
</script>

<template>
  <div class="multiselect-bar">
    <span>
      <i class="pi pi-check-square" />
      {{ selectedCount === 1 ? $t('bulkBar.selectedSingular', { count: selectedCount }) : $t('bulkBar.selectedPlural', { count: selectedCount }) }}
    </span>
    <div class="ms-actions">
      <Button
        :label="$t('bulkBar.clear')"
        icon="pi pi-times"
        text
        size="small"
        @click="emit('clear')"
      />
      <Button
        :label="$t('bulkBar.approveAll')"
        icon="pi pi-check"
        severity="success"
        size="small"
        :disabled="!allSelectedPending"
        @click="emit('bulk-approve')"
      />
      <Button
        :label="$t('bulkBar.rejectAll')"
        icon="pi pi-times"
        severity="danger"
        size="small"
        :disabled="!canBulkReject || !allSelectedPending"
        :tooltip="!canBulkReject ? $t('bulkBar.bulkRejectTooltip') : undefined"
        :tooltipOptions="{ position: 'top' }"
        @click="emit('open-bulk-reject')"
      />
    </div>
  </div>
</template>

<style scoped>
.multiselect-bar {
  background: linear-gradient(135deg, var(--p-primary-500) 0%, var(--p-primary-600) 100%);
  border: none;
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.ms-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  .multiselect-bar {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .ms-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
