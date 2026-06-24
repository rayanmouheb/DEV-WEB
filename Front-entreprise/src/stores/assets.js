import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api.js'

export const useAssetsStore = defineStore('assets', () => {
  const list = ref([])
  const loading = ref(false)

  async function fetchByCompany(companyId) {
    loading.value = true
    list.value = await api.get(`/assets?company_id=${companyId}`)
    loading.value = false
  }

  async function create(payload) {
    const created = await api.post('/assets', payload)
    list.value.push(created)
    return created
  }

  async function update(id, payload) {
    const updated = await api.put(`/assets/${id}`, payload)
    const idx = list.value.findIndex(a => a.id === id)
    if (idx !== -1) list.value[idx] = updated
    return updated
  }

  async function remove(id) {
    await api.delete(`/assets/${id}`)
    list.value = list.value.filter(a => a.id !== id)
  }

  return { list, loading, fetchByCompany, create, update, remove }
})
