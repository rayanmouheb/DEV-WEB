<script setup>
import { useCompanyStore } from '../stores/company.js'
import { useRouter } from 'vue-router'

const company = useCompanyStore()
const router = useRouter()
</script>

<template>
  <div class="home">
    <div class="hero">
      <div class="hero-icon">🛡️</div>
      <h1>CyberTwin</h1>
      <p class="hero-sub">Simulateur de Risque Cyber pour PME</p>
      <p class="hero-desc">
        Modélisez votre entreprise fictive, gérez vos actifs numériques et évaluez
        automatiquement votre niveau de risque cyber.
      </p>
      <div class="hero-actions">
        <button class="btn btn-primary" @click="router.push('/company')">
          🏢 Gérer l'entreprise
        </button>
        <button class="btn btn-secondary" @click="router.push('/dashboard')">
          📊 Tableau de bord
        </button>
      </div>
    </div>

    <div class="features">
      <div class="feature-card" @click="router.push('/company')">
        <div class="feature-icon">🏢</div>
        <h3>Entreprise</h3>
        <p>Créez et configurez votre entreprise fictive avec son secteur d'activité et son infrastructure.</p>
      </div>
      <div class="feature-card" @click="router.push('/assets')">
        <div class="feature-icon">💻</div>
        <h3>Actifs</h3>
        <p>Inventoriez vos actifs numériques : serveurs, bases de données, postes, routeurs, pare-feux.</p>
      </div>
      <div class="feature-card" @click="router.push('/vulnerabilities')">
        <div class="feature-icon">🔍</div>
        <h3>Vulnérabilités</h3>
        <p>Associez des vulnérabilités à chaque actif et définissez leur niveau de criticité.</p>
      </div>
      <div class="feature-card" @click="router.push('/dashboard')">
        <div class="feature-icon">📊</div>
        <h3>Dashboard</h3>
        <p>Visualisez l'état global de votre sécurité avec des graphiques et statistiques.</p>
      </div>
      <div class="feature-card" @click="router.push('/report')">
        <div class="feature-icon">📋</div>
        <h3>Rapport</h3>
        <p>Générez un rapport complet de cybersécurité avec des recommandations personnalisées.</p>
      </div>
      <div class="feature-card" @click="router.push('/history')">
        <div class="feature-icon">🕐</div>
        <h3>Historique</h3>
        <p>Consultez l'historique de vos analyses de risque et suivez l'évolution dans le temps.</p>
      </div>
    </div>

    <div class="company-info" v-if="company.selected">
      <p>Entreprise active : <strong>{{ company.selected.name }}</strong>
        ({{ company.selected.sector }}) —
        <span :class="['badge', 'badge-info']">{{ company.selected.employee_count }} employés</span>
      </p>
    </div>
  </div>
</template>

<style scoped>
.home { max-width: 900px; margin: 0 auto; }

.hero {
  text-align: center;
  padding: 48px 24px;
  background: linear-gradient(135deg, #1e40af 0%, #1e293b 100%);
  border-radius: 16px;
  color: white;
  margin-bottom: 36px;
}
.hero-icon { font-size: 56px; margin-bottom: 12px; }
.hero h1 { font-size: 40px; font-weight: 800; color: white; margin-bottom: 8px; }
.hero-sub { font-size: 18px; color: #93c5fd; margin-bottom: 16px; }
.hero-desc { font-size: 15px; color: #cbd5e1; max-width: 520px; margin: 0 auto 28px; }
.hero-actions { display: flex; gap: 12px; justify-content: center; }

.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.feature-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
}
.feature-card:hover { border-color: #2563eb; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(37,99,235,0.15); }
.feature-icon { font-size: 28px; margin-bottom: 10px; }
.feature-card h3 { font-size: 15px; margin-bottom: 6px; }
.feature-card p { font-size: 13px; color: var(--color-text-muted); line-height: 1.5; }

.company-info {
  text-align: center;
  padding: 14px;
  background: var(--color-bg-soft);
  border-radius: 8px;
  font-size: 14px;
  color: var(--color-text-muted);
}
.badge-info { background: #dbeafe; color: #1d4ed8; }

@media (max-width: 768px) {
  .features { grid-template-columns: 1fr 1fr; }
  .hero-actions { flex-direction: column; align-items: center; }
}
</style>
