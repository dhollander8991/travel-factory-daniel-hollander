<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import DatePicker from 'primevue/datepicker';
import Textarea from 'primevue/textarea';

interface SubmitPayload {
  startDate: string;
  endDate: string;
  reason: string | undefined;
}

const props = defineProps<{
  visible: boolean;
  submitting: boolean;
  serverErrors: Record<string, string>;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  submit: [payload: SubmitPayload];
}>();

const { t } = useI18n();

const formStartDate = ref<Date | null>(null);
const formEndDate = ref<Date | null>(null);
const formReason = ref<string>('');
const localErrors = ref<Record<string, string>>({});

const allErrors = computed<Record<string, string>>(() => ({
  ...props.serverErrors,
  ...localErrors.value,
}));

watch(
  () => props.visible,
  (newVal) => {
    if (!newVal) {
      formStartDate.value = null;
      formEndDate.value = null;
      formReason.value = '';
      localErrors.value = {};
    }
  }
);

const handleSubmit = (): void => {
  localErrors.value = {};

  if (!formStartDate.value) {
    localErrors.value.startDate = t('dialog.errors.startDateRequired');
    return;
  }

  if (!formEndDate.value) {
    localErrors.value.endDate = t('dialog.errors.endDateRequired');
    return;
  }

  if (formEndDate.value < formStartDate.value) {
    localErrors.value.endDate = t('dialog.errors.endDateAfterStart');
    return;
  }

  emit('submit', {
    startDate: formStartDate.value.toISOString().split('T')[0],
    endDate: formEndDate.value.toISOString().split('T')[0],
    reason: formReason.value || undefined,
  });
};
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="$t('dialog.title')"
    :style="{ width: '480px' }"
    :breakpoints="{ '768px': '92vw' }"
    modal
  >
    <div class="dialog-form">
      <div class="field">
        <label>{{ $t('dialog.startDate') }} <span class="required">*</span></label>
        <DatePicker
          v-model="formStartDate"
          :placeholder="$t('dialog.startDatePlaceholder')"
          :minDate="new Date()"
          dateFormat="yy-mm-dd"
          :class="{ 'p-invalid': allErrors.startDate }"
          fluid
        />
        <small v-if="allErrors.startDate" class="error">{{ allErrors.startDate }}</small>
      </div>

      <div class="field">
        <label>{{ $t('dialog.endDate') }} <span class="required">*</span></label>
        <DatePicker
          v-model="formEndDate"
          :placeholder="$t('dialog.endDatePlaceholder')"
          :minDate="formStartDate || new Date()"
          dateFormat="yy-mm-dd"
          :class="{ 'p-invalid': allErrors.endDate }"
          fluid
        />
        <small v-if="allErrors.endDate" class="error">{{ allErrors.endDate }}</small>
      </div>

      <div class="field">
        <label>{{ $t('dialog.reason') }} <span class="optional">{{ $t('dialog.optional') }}</span></label>
        <Textarea
          v-model="formReason"
          :placeholder="$t('dialog.reasonPlaceholder')"
          rows="3"
          :maxlength="500"
          fluid
        />
        <small class="char-count">{{ formReason.length }} / 500</small>
      </div>
    </div>

    <template #footer>
      <Button :label="$t('dialog.cancel')" text @click="emit('update:visible', false)" />
      <Button
        :label="$t('dialog.submit')"
        icon="pi pi-send"
        :loading="submitting"
        :disabled="submitting"
        @click="handleSubmit"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
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

.optional {
  font-size: 11px;
  color: var(--p-text-muted-color);
  font-weight: 400;
}

.error {
  color: var(--p-red-500);
  font-size: 12px;
}

.char-count {
  font-size: 11px;
  color: var(--p-text-muted-color);
  text-align: right;
}
</style>
