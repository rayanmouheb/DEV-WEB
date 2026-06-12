<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app-layout">

    <nav class="navbar">
      <div class="nav-brand">🛡️ CyberTwin</div>
      <div class="nav-links">
        <RouterLink to="/">Accueil</RouterLink>
        <RouterLink to="/company">Entreprise</RouterLink>
        <RouterLink to="/assets">Actifs</RouterLink>
        <RouterLink to="/vulnerabilities">Vulnérabilités</RouterLink>
        <RouterLink to="/dashboard">Dashboard</RouterLink>
        <RouterLink to="/report">Rapport</RouterLink>
      </div>
    </nav>

    <main class="main-content">
      <RouterView />
    </main>

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
  padding: 0 32px;
  height: 60px;
  background-color: #1e293b;
  color: white;
}

.nav-brand {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.nav-links {
  display: flex;
  gap: 8px;
}

.nav-links a {
  color: #94a3b8;
  text-decoration: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-links a:hover {
  color: white;
  background-color: #334155;
}

.nav-links a.router-link-active {
  color: white;
  background-color: #2563eb;
}

.main-content {
  flex: 1;
  padding: 32px;
}
</style>