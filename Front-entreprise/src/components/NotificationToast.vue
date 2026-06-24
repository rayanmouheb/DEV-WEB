<script setup>
import { useNotificationsStore } from '../stores/notifications.js'
const notif = useNotificationsStore()
</script>

<template>
  <div class="toast-container">
    <div
      v-for="n in notif.list"
      :key="n.id"
      class="toast"
      :class="n.type"
      @click="notif.remove(n.id)"
    >
      <span class="toast-icon">
        {{ n.type === 'success' ? '✅' : n.type === 'error' ? '❌' : n.type === 'warning' ? '⚠️' : 'ℹ️' }}
      </span>
      {{ n.message }}
    </div>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 9999;
}
.toast {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  animation: slide-in 0.2s ease;
  max-width: 380px;
}
.toast.success { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
.toast.error   { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
.toast.warning { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
.toast.info    { background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; }
@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
</style>
