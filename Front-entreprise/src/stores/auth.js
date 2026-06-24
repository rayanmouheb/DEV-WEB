import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../services/api.js'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') ?? null)
  const username = ref(localStorage.getItem('username') ?? null)
  const isAuthenticated = computed(() => !!token.value)

  async function login(u, p) {
    const data = await api.post('/auth/login', { username: u, password: p })
    token.value = data.token
    username.value = data.username
    localStorage.setItem('token', data.token)
    localStorage.setItem('username', data.username)
  }

  async function register(u, p) {
    const data = await api.post('/auth/register', { username: u, password: p })
    token.value = data.token
    username.value = data.username
    localStorage.setItem('token', data.token)
    localStorage.setItem('username', data.username)
  }

  function logout() {
    token.value = null
    username.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('username')
  }

  return { token, username, isAuthenticated, login, register, logout }
})
