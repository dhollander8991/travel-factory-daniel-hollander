<script setup lang="ts">
import { RouterView } from 'vue-router';
import Toast from 'primevue/toast';
</script>

<template>
  <RouterView />
  <Toast position="top-center" />
</template>

<style>
* {
  box-sizing: border-box;
}

img, video, canvas, svg {
  max-width: 100%;
}

html, body, #app, #root {
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  overflow-x: clip;
}

.p-toast {
  z-index: 9999 !important;
  max-width: calc(100vw - 32px) !important;
}

.p-toast-message {
  margin: 0 16px !important;
}
</style>
