<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Textarea from 'primevue/textarea';
import { VacationRequest } from '@org/shared';
import { formatDate } from '../utils/formatters';

const props = defineProps<{
  visible: boolean;
  isBulk: boolean;
  selectedRequests: VacationRequest[];
  submitting: boolean;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  confirm: [comment: string];
}>();

const rejectComment = ref<string>('');

watch(
  () => props.visible,
  (newVal) => {
    if (!newVal) {
      rejectComment.value = '';
    }
  }
);

const initials = (name: string): string =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase();

const handleConfirm = (): void => {
  if (!rejectComment.value.trim()) return;
  emit('confirm', rejectComment.value);
};
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="isBulk ? $t('rejectDialog.titleBulk', { count: selectedRequests.length }) : $t('rejectDialog.titleSingle')"
    :style="{ width: '460px' }"
    :breakpoints="{ '768px': '92vw' }"
    :pt="{
      header: { style: 'padding-bottom: 8px' },
      content: { style: 'padding-top: 0' },
    }"
    modal
  >
    <div class="dialog-body">
      <p class="dialog-sub">
        {{ $t('rejectDialog.commentRequired') }}
        {{ isBulk ? $t('rejectDialog.notifiedBulk') : $t('rejectDialog.notifiedSingle') }}
      </p>

      <div v-if="isBulk" class="affected-list">
        <div
          v-for="req in selectedRequests"
          :key="req.id"
          class="affected-item"
        >
          <div class="emp-avatar-sm">{{ initials(req.user.name) }}</div>
          <span>{{ req.user.name }} · {{ formatDate(req.startDate) }} – {{ formatDate(req.endDate) }}</span>
        </div>
      </div>

      <div class="field">
        <label>{{ $t('rejectDialog.commentLabel') }} <span class="required">*</span></label>
        <Textarea
          v-model="rejectComment"
          :placeholder="$t('rejectDialog.commentPlaceholder')"
          rows="4"
          :class="{ 'p-invalid': !rejectComment.trim() && submitting }"
          fluid
        />
      </div>
    </div>

    <template #footer>
      <Button :label="$t('rejectDialog.cancel')" text @click="emit('update:visible', false)" />
      <Button
        :label="isBulk ? $t('rejectDialog.confirmBulk', { count: selectedRequests.length }) : $t('rejectDialog.confirmSingle')"
        icon="pi pi-times"
        severity="danger"
        :loading="submitting"
        :disabled="!rejectComment.trim() || submitting"
        @click="handleConfirm"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 8px;
}

.dialog-sub {
  font-size: 13px;
  color: var(--p-text-muted-color);
}

.affected-list {
  background: var(--p-surface-50);
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.affected-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
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

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 13px;
  font-weight: 500;
}

.required {
  color: var(--p-red-500);
}
</style>
