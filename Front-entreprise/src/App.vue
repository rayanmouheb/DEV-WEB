<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { useThemeStore } from './stores/theme.js'
import { useAuthStore } from './stores/auth.js'
import { useCompanyStore } from './stores/company.js'
import { useNotificationsStore } from './stores/notifications.js'
import NotificationToast from './components/NotificationToast.vue'
import { onMounted } from 'vue'

const theme = useThemeStore()
const auth = useAuthStore()
const company = useCompanyStore()
const notif = useNotificationsStore()

onMounted(() => company.fetchAll())

function handleLogout() {
  auth.logout()
  notif.success('Déconnexion réussie')
}
</script>

<template>
  <div class="app-layout">
    <nav class="navbar">
      <div class="nav-left">
        <RouterLink to="/" class="nav-brand">🛡️ CyberTwin</RouterLink>
        <div class="nav-links">
          <RouterLink to="/">Accueil</RouterLink>
          <RouterLink to="/company">Entreprise</RouterLink>
          <RouterLink to="/assets">Actifs</RouterLink>
          <RouterLink to="/vulnerabilities">Vulnérabilités</RouterLink>
          <RouterLink to="/dashboard">Dashboard</RouterLink>
          <RouterLink to="/report">Rapport</RouterLink>
        </div>
      </div>
      <div class="nav-right">
        <button class="theme-toggle" @click="theme.toggle()" :title="theme.isDark ? 'Mode clair' : 'Mode sombre'">
          {{ theme.isDark ? '☀️' : '🌙' }}
        </button>
        <template v-if="auth.isAuthenticated">
          <span class="nav-user">👤 {{ auth.username }}</span>
          <button class="btn btn-sm btn-secondary" @click="handleLogout">Déconnexion</button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="btn btn-sm btn-primary">Connexion</RouterLink>
        </template>
      </div>
    </nav>

    <main class="main-content">
      <RouterView />
    </main>

    <NotificationToast />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;
  background: var(--color-nav);
  color: white;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.nav-left { display: flex; align-items: center; gap: 24px; }
.nav-right { display: flex; align-items: center; gap: 12px; }

.nav-brand {
  font-size: 17px;
  font-weight: 700;
  color: white;
  white-space: nowrap;
}

.nav-links { display: flex; gap: 2px; }
.nav-links a {
  color: var(--color-nav-text);
  text-decoration: none;
  padding: 5px 11px;
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.2s;
  white-space: nowrap;
}
.nav-links a:hover { color: white; background: rgba(255,255,255,0.1); }
.nav-links a.router-link-active { color: white; background: #2563eb; }

.theme-toggle {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}
.theme-toggle:hover { background: rgba(255,255,255,0.1); }

.nav-user { font-size: 13px; color: #94a3b8; }

.main-content { flex: 1; padding: 28px; }

@media (max-width: 1024px) {
  .nav-links { display: none; }
}
</style>
