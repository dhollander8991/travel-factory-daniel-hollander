<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { useAuthStore } from '../stores/authStore';
import api from '../services/axios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const { t, locale } = useI18n();
const { user } = useAuthStore();

const isOpen = ref(false);
const messages = ref<Message[]>([]);
const inputText = ref('');
const loading = ref(false);
const messagesEl = ref<HTMLElement | null>(null);

const suggestions = computed(() => [
  t('chat.suggestions.pending'),
  t('chat.suggestions.policy'),
  t('chat.suggestions.nextWeek'),
]);

const showSuggestions = computed(() => {
  if (loading.value) return false;
  if (messages.value.length === 0) return true;
  return messages.value[messages.value.length - 1].role === 'assistant';
});

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
    }
  });
};

const sendMessage = async (text: string) => {
  const trimmed = text.trim();
  if (!trimmed || loading.value) return;

  messages.value.push({ role: 'user', content: trimmed });
  inputText.value = '';
  loading.value = true;
  scrollToBottom();

  try {
    const { data } = await api.post('/api/v1/chat', {
      messages: messages.value,
      userId: user.value?.id,
      language: locale.value,
    });
    messages.value.push({ role: 'assistant', content: data.reply });
  } catch {
    messages.value.push({ role: 'assistant', content: t('chat.error') });
  } finally {
    loading.value = false;
    scrollToBottom();
  }
};

const handleSend = () => sendMessage(inputText.value);
</script>

<template>
  <div class="chat-container">
    <Transition name="chat-slide">
      <div v-if="isOpen" class="chat-panel">
        <div class="chat-header">
          <div class="chat-header-title">
            <i class="pi pi-comments" />
            <span>{{ $t('chat.title') }}</span>
          </div>
          <Button icon="pi pi-times" text rounded size="small" @click="isOpen = false" />
        </div>

        <div class="chat-messages" ref="messagesEl">
          <div v-if="messages.length === 0" class="msg assistant">
            <div class="bubble">{{ $t('chat.welcome') }}</div>
          </div>

          <div
            v-for="(msg, i) in messages"
            :key="i"
            class="msg"
            :class="msg.role"
          >
            <div class="bubble">{{ msg.content }}</div>
          </div>

          <div v-if="loading" class="msg assistant">
            <div class="bubble loading-bubble">
              <span class="dot" /><span class="dot" /><span class="dot" />
            </div>
          </div>

          <div v-if="showSuggestions" class="suggestions">
            <button
              v-for="chip in suggestions"
              :key="chip"
              class="chip"
              @click="sendMessage(chip)"
            >
              {{ chip }}
            </button>
          </div>
        </div>

        <div class="chat-input-row">
          <InputText
            v-model="inputText"
            :placeholder="$t('chat.placeholder')"
            class="chat-input"
            @keydown.enter="handleSend"
          />
          <Button
            icon="pi pi-send"
            :loading="loading"
            :disabled="!inputText.trim() || loading"
            @click="handleSend"
          />
        </div>
      </div>
    </Transition>

    <Button
      icon="pi pi-comments"
      class="chat-toggle"
      rounded
      @click="isOpen = !isOpen"
    />
  </div>
</template>

<style scoped>
.chat-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.chat-toggle {
  width: 52px;
  height: 52px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.chat-panel {
  width: 320px;
  height: 480px;
  background: var(--p-surface-0);
  border-radius: 12px;
  border: 1px solid var(--p-surface-200);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-slide-enter-active,
.chat-slide-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.chat-slide-enter-from,
.chat-slide-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.97);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 12px 16px;
  border-bottom: 1px solid var(--p-surface-200);
  flex-shrink: 0;
}

.chat-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
}

.chat-header-title i {
  color: var(--p-primary-500);
  font-size: 16px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.msg {
  display: flex;
  max-width: 85%;
}

.msg.user {
  align-self: flex-end;
}

.msg.assistant {
  align-self: flex-start;
}

.bubble {
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.msg.user .bubble {
  background: var(--p-primary-500);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.msg.assistant .bubble {
  background: var(--p-surface-100);
  color: var(--p-text-color);
  border-bottom-left-radius: 4px;
}

.loading-bubble {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 14px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--p-text-muted-color);
  animation: bounce 1.2s ease-in-out infinite;
}

.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 4px;
}

.chip {
  background: var(--p-surface-0);
  border: 1px solid var(--p-surface-300);
  border-radius: 16px;
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
  color: var(--p-text-color);
  transition: background 0.15s;
}

.chip:hover {
  background: var(--p-surface-100);
}

.chat-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--p-surface-200);
  flex-shrink: 0;
}

.chat-input {
  flex: 1;
  font-size: 13px;
}

@media (max-width: 768px) {
  .chat-container {
    bottom: 16px;
    right: 16px;
  }

  .chat-panel {
    position: fixed;
    left: 8px;
    right: 8px;
    bottom: 80px;
    width: auto;
    height: auto;
    max-height: 80vh;
  }
}
</style>
