<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useNotificationsStore } from '../stores/notifications.js'

const router = useRouter()
const auth = useAuthStore()
const notif = useNotificationsStore()

const mode = ref('login')
const username = ref('')
const password = ref('')
const loading = ref(false)

async function submit() {
  if (!username.value || !password.value) return
  loading.value = true
  try {
    if (mode.value === 'login') {
      await auth.login(username.value, password.value)
      notif.success(`Bienvenue, ${auth.username} !`)
    } else {
      await auth.register(username.value, password.value)
      notif.success('Compte créé avec succès !')
    }
    router.push('/')
  } catch (e) {
    notif.error(e.message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="login-icon">🛡️</div>
        <h1>CyberTwin</h1>
        <p>{{ mode === 'login' ? 'Connectez-vous à votre espace' : 'Créez votre compte' }}</p>
      </div>

      <form @submit.prevent="submit" class="login-form">
        <div class="form-group">
          <label>Nom d'utilisateur</label>
          <input v-model="username" type="text" class="form-control" placeholder="admin" required />
        </div>
        <div class="form-group">
          <label>Mot de passe</label>
          <input v-model="password" type="password" class="form-control" placeholder="••••••" required />
        </div>
        <button type="submit" class="btn btn-primary w-full" :disabled="loading">
          {{ loading ? 'Chargement...' : (mode === 'login' ? 'Se connecter' : 'Créer le compte') }}
        </button>
      </form>

      <div class="login-footer">
        <template v-if="mode === 'login'">
          Pas de compte ?
          <button class="link-btn" @click="mode = 'register'">S'inscrire</button>
        </template>
        <template v-else>
          Déjà un compte ?
          <button class="link-btn" @click="mode = 'login'">Se connecter</button>
        </template>
      </div>

      <div class="demo-hint">
        💡 Compte démo : <code>admin</code> / <code>admin123</code>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px);
}
.login-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 36px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}
.login-header { text-align: center; margin-bottom: 28px; }
.login-icon { font-size: 48px; margin-bottom: 8px; }
.login-header h1 { font-size: 26px; }
.login-header p { color: var(--color-text-muted); font-size: 14px; margin-top: 4px; }
.login-form { display: flex; flex-direction: column; gap: 16px; }
.w-full { width: 100%; justify-content: center; margin-top: 4px; }
.login-footer { text-align: center; margin-top: 20px; font-size: 14px; color: var(--color-text-muted); }
.link-btn { background: none; border: none; color: #2563eb; cursor: pointer; font-size: 14px; }
.link-btn:hover { text-decoration: underline; }
.demo-hint {
  margin-top: 16px;
  padding: 10px 14px;
  background: var(--color-bg-soft);
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
  color: var(--color-text-muted);
}
code { background: var(--color-border); padding: 1px 5px; border-radius: 4px; font-family: monospace; }
</style>
