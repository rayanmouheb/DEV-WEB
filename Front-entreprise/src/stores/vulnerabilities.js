import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api.js'

export const useVulnerabilitiesStore = defineStore('vulnerabilities', () => {
  const list = ref([])
  const loading = ref(false)

  async function fetchByCompany(companyId) {
    loading.value = true
    list.value = await api.get(`/vulnerabilities?company_id=${companyId}`)
    loading.value = false
  }

  async function fetchByAsset(assetId) {
    loading.value = true
    list.value = await api.get(`/vulnerabilities?asset_id=${assetId}`)
    loading.value = false
  }

  async function create(payload) {
    const created = await api.post('/vulnerabilities', payload)
    list.value.push(created)
    return created
  }

  async function update(id, payload) {
    const updated = await api.put(`/vulnerabilities/${id}`, payload)
    const idx = list.value.findIndex(v => v.id === id)
    if (idx !== -1) list.value[idx] = updated
    return updated
  }

  async function remove(id) {
    await api.delete(`/vulnerabilities/${id}`)
    list.value = list.value.filter(v => v.id !== id)
  }

  return { list, loading, fetchByCompany, fetchByAsset, create, update, remove }
})
