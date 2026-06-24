import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../services/api.js'

export const useCompanyStore = defineStore('company', () => {
  const companies = ref([])
  const selectedId = ref(Number(localStorage.getItem('selectedCompanyId')) || null)
  const loading = ref(false)

  const selected = computed(() => companies.value.find(c => c.id === selectedId.value) ?? null)

  async function fetchAll() {
    loading.value = true
    companies.value = await api.get('/company')
    if (!selectedId.value && companies.value.length) select(companies.value[0].id)
    loading.value = false
  }

  function select(id) {
    selectedId.value = id
    localStorage.setItem('selectedCompanyId', id)
  }

  async function create(payload) {
    const created = await api.post('/company', payload)
    companies.value.push(created)
    select(created.id)
    return created
  }

  async function update(id, payload) {
    const updated = await api.put(`/company/${id}`, payload)
    const idx = companies.value.findIndex(c => c.id === id)
    if (idx !== -1) companies.value[idx] = updated
    return updated
  }

  async function remove(id) {
    await api.delete(`/company/${id}`)
    companies.value = companies.value.filter(c => c.id !== id)
    if (selectedId.value === id) {
      selectedId.value = companies.value[0]?.id ?? null
      if (selectedId.value) localStorage.setItem('selectedCompanyId', selectedId.value)
      else localStorage.removeItem('selectedCompanyId')
    }
  }

  return { companies, selectedId, selected, loading, fetchAll, select, create, update, remove }
})
