import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api.js'

export const useRiskStore = defineStore('risk', () => {
  const current = ref(null)
  const history = ref([])
  const loading = ref(false)

  async function calculate(companyId) {
    loading.value = true
    current.value = await api.post('/risk/calculate', { company_id: companyId })
    loading.value = false
    return current.value
  }

  async function fetchHistory(companyId) {
    history.value = await api.get(`/risk/history/${companyId}`)
  }

  async function deleteHistory(id) {
    await api.delete(`/risk/history/${id}`)
    history.value = history.value.filter(h => h.id !== id)
  }

  return { current, history, loading, calculate, fetchHistory, deleteHistory }
})
