import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationsStore = defineStore('notifications', () => {
  const list = ref([])
  let nextId = 1

  function push(message, type = 'info', duration = 4000) {
    const id = nextId++
    list.value.push({ id, message, type })
    if (duration > 0) setTimeout(() => remove(id), duration)
  }

  function remove(id) {
    list.value = list.value.filter(n => n.id !== id)
  }

  const success = (msg) => push(msg, 'success')
  const error = (msg) => push(msg, 'error')
  const info = (msg) => push(msg, 'info')
  const warn = (msg) => push(msg, 'warning')

  return { list, push, remove, success, error, info, warn }
})
