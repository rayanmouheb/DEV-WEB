<script setup>
import { useNotificationsStore } from '../stores/notifications.js'
const notif = useNotificationsStore()
</script>

<template>
  <div class="notif-container">
    <transition-group name="notif">
      <div
        v-for="n in notif.list"
        :key="n.id"
        :class="['notif-item', `notif-${n.type}`]"
        @click="notif.remove(n.id)"
      >
        <span class="notif-icon">{{ { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' }[n.type] }}</span>
        <span>{{ n.message }}</span>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.notif-container {
  position: fixed;
  top: 72px;
  right: 20px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 340px;
}
.notif-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  color: #fff;
}
.notif-success { background: #059669; }
.notif-error   { background: #dc2626; }
.notif-info    { background: #2563eb; }
.notif-warning { background: #d97706; }
.notif-enter-active, .notif-leave-active { transition: all 0.3s ease; }
.notif-enter-from { transform: translateX(100%); opacity: 0; }
.notif-leave-to   { transform: translateX(100%); opacity: 0; }
</style>
