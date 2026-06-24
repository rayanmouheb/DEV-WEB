<script setup>
import { ref, onMounted, computed } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend
} from 'chart.js'
import { useCompanyStore } from '../stores/company.js'
import { useAssetsStore } from '../stores/assets.js'
import { useVulnerabilitiesStore } from '../stores/vulnerabilities.js'
import { useRiskStore } from '../stores/risk.js'
import RiskBadge from '../components/RiskBadge.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const company = useCompanyStore()
const assets = useAssetsStore()
const vulns = useVulnerabilitiesStore()
const risk = useRiskStore()

onMounted(async () => {
  if (company.selectedId) {
    await Promise.all([
      assets.fetchByCompany(company.selectedId),
      vulns.fetchByCompany(company.selectedId),
    ])
    await risk.calculate(company.selectedId)
  }
})

async function recalculate() {
  await risk.calculate(company.selectedId)
}

const TYPE_LABELS = {
  serveur_web: 'Serveur Web', base_de_donnees: 'BDD',
  poste_utilisateur: 'Poste', routeur: 'Routeur',
  pare_feu: 'Pare-feu', application_metier: 'App métier',
}

const assetTypeData = computed(() => {
  const counts = {}
  for (const a of assets.list) counts[TYPE_LABELS[a.type] ?? a.type] = (counts[TYPE_LABELS[a.type] ?? a.type] ?? 0) + 1
  return {
    labels: Object.keys(counts),
    datasets: [{
      label: 'Actifs par type',
      data: Object.values(counts),
      backgroundColor: ['#3b82f6','#8b5cf6','#ec4899','#f59e0b','#10b981','#6366f1'],
      borderRadius: 6,
    }],
  }
})

const vulnCritData = computed(() => {
  const c = risk.current?.criticalityCount ?? { faible: 0, moyen: 0, eleve: 0 }
  return {
    labels: ['Faible', 'Moyen', 'Élevé'],
    datasets: [{ data: [c.faible, c.moyen, c.eleve], backgroundColor: ['#10b981','#f59e0b','#ef4444'], borderWidth: 0 }],
  }
})

const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
const barOptions = { ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }

const riskColor = computed(() => ({
  eleve: '#ef4444', moyen: '#f59e0b', faible: '#10b981', none: '#94a3b8',
}[risk.current?.level ?? 'none']))

const riskPercent = computed(() => {
  const s = risk.current?.score ?? 0
  return Math.min(100, Math.round((s / 30) * 100))
})
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">📊 Tableau de bord</div>
        <div class="page-subtitle">Vue globale de la posture de sécurité — {{ company.selected?.name ?? '–' }}</div>
      </div>
      <button class="btn btn-primary" @click="recalculate" :disabled="risk.loading">
        {{ risk.loading ? '⏳ Calcul...' : '🔄 Recalculer' }}
      </button>
    </div>

    <!-- Stats cards -->
    <div class="grid-4">
      <div class="stat-card">
        <div class="stat-value">{{ assets.list.length }}</div>
        <div class="stat-label">💻 Actifs</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ vulns.list.length }}</div>
        <div class="stat-label">🔍 Vulnérabilités</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ risk.current?.exposedCount ?? 0 }}</div>
        <div class="stat-label">🌐 Exposés Internet</div>
      </div>
      <div class="stat-card" :style="{ borderColor: riskColor }">
        <div class="stat-value" :style="{ color: riskColor }">{{ risk.current?.score ?? 0 }}</div>
        <div class="stat-label">⚠️ Score de risque</div>
      </div>
    </div>

    <!-- Risk meter -->
    <div class="card mt-16">
      <div class="flex items-center justify-between mb-16">
        <h3>Niveau de risque global</h3>
        <RiskBadge :level="risk.current?.level" :score="risk.current?.score" />
      </div>
      <div class="risk-bar-bg">
        <div class="risk-bar-fill" :style="{ width: riskPercent + '%', background: riskColor }"></div>
      </div>
      <div class="risk-bar-labels">
        <span>Faible</span><span>Moyen</span><span>Élevé</span>
      </div>
      <div class="risk-breakdown mt-16">
        <div class="breakdown-item">
          <span class="badge badge-eleve">{{ risk.current?.criticalityCount?.eleve ?? 0 }}</span>
          <span>vuln. élevées</span>
        </div>
        <div class="breakdown-item">
          <span class="badge badge-moyen">{{ risk.current?.criticalityCount?.moyen ?? 0 }}</span>
          <span>vuln. moyennes</span>
        </div>
        <div class="breakdown-item">
          <span class="badge badge-faible">{{ risk.current?.criticalityCount?.faible ?? 0 }}</span>
          <span>vuln. faibles</span>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid-2 mt-16">
      <div class="card">
        <h3>Répartition des actifs par type</h3>
        <div class="chart-container mt-16">
          <Bar v-if="assets.list.length" :data="assetTypeData" :options="barOptions" />
          <div v-else class="empty-state">Aucun actif</div>
        </div>
      </div>
      <div class="card">
        <h3>Répartition des vulnérabilités</h3>
        <div class="chart-container mt-16">
          <Doughnut v-if="vulns.list.length" :data="vulnCritData" :options="chartOptions" />
          <div v-else class="empty-state">Aucune vulnérabilité</div>
        </div>
      </div>
    </div>

    <!-- Histogramme des actifs exposés vs internes -->
    <div class="card mt-16">
      <h3>Exposition Internet des actifs</h3>
      <div class="exposure-bars mt-16">
        <div class="exposure-row">
          <span class="exposure-label">Exposés</span>
          <div class="exposure-track">
            <div
              class="exposure-fill exposed"
              :style="{ width: assets.list.length ? (risk.current?.exposedCount / assets.list.length * 100) + '%' : '0%' }"
            ></div>
          </div>
          <span class="exposure-count">{{ risk.current?.exposedCount ?? 0 }}</span>
        </div>
        <div class="exposure-row">
          <span class="exposure-label">Internes</span>
          <div class="exposure-track">
            <div
              class="exposure-fill internal"
              :style="{ width: assets.list.length ? ((assets.list.length - (risk.current?.exposedCount??0)) / assets.list.length * 100) + '%' : '0%' }"
            ></div>
          </div>
          <span class="exposure-count">{{ assets.list.length - (risk.current?.exposedCount ?? 0) }}</span>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.mb-16 { margin-bottom: 16px; }
.chart-container { height: 220px; }

.risk-bar-bg { height: 14px; background: var(--color-border); border-radius: 999px; overflow: hidden; }
.risk-bar-fill { height: 100%; border-radius: 999px; transition: width 0.6s ease; }
.risk-bar-labels { display: flex; justify-content: space-between; font-size: 12px; color: var(--color-text-muted); margin-top: 6px; }

.risk-breakdown { display: flex; gap: 20px; }
.breakdown-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--color-text-muted); }

.exposure-bars { display: flex; flex-direction: column; gap: 12px; }
.exposure-row { display: flex; align-items: center; gap: 12px; }
.exposure-label { width: 80px; font-size: 13px; }
.exposure-track { flex: 1; height: 24px; background: var(--color-border); border-radius: 4px; overflow: hidden; }
.exposure-fill { height: 100%; border-radius: 4px; transition: width 0.6s; }
.exposure-fill.exposed { background: #ef4444; }
.exposure-fill.internal { background: #10b981; }
.exposure-count { width: 30px; text-align: right; font-size: 13px; font-weight: 600; }

</style>
