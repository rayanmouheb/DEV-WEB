<script setup>
import { onMounted, computed } from 'vue'
import { useCompanyStore } from '../stores/company.js'
import { useAssetsStore } from '../stores/assets.js'
import { useVulnerabilitiesStore } from '../stores/vulnerabilities.js'
import { useRiskStore } from '../stores/risk.js'
import RiskBadge from '../components/RiskBadge.vue'

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
const TYPE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1']

const assetTypeBars = computed(() => {
  const counts = {}
  for (const a of assets.list) {
    const label = TYPE_LABELS[a.type] ?? a.type
    counts[label] = (counts[label] ?? 0) + 1
  }
  const max = Math.max(...Object.values(counts), 1)
  return Object.entries(counts).map(([label, count], i) => ({
    label,
    count,
    width: Math.round((count / max) * 100),
    color: TYPE_COLORS[i % TYPE_COLORS.length],
  }))
})

const vulnBars = computed(() => {
  const c = risk.current?.criticalityCount ?? { faible: 0, moyen: 0, eleve: 0 }
  const total = c.faible + c.moyen + c.eleve || 1
  return [
    { label: 'Élevé', count: c.eleve, width: Math.round((c.eleve / total) * 100), color: '#ef4444' },
    { label: 'Moyen', count: c.moyen, width: Math.round((c.moyen / total) * 100), color: '#f59e0b' },
    { label: 'Faible', count: c.faible, width: Math.round((c.faible / total) * 100), color: '#10b981' },
  ]
})

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

    <!-- Charts CSS -->
    <div class="grid-2 mt-16">
      <div class="card">
        <h3>Répartition des actifs par type</h3>
        <div class="css-bars mt-16">
          <div v-if="!assetTypeBars.length" class="empty-state">Aucun actif</div>
          <div v-for="bar in assetTypeBars" :key="bar.label" class="css-bar-row">
            <span class="css-bar-label">{{ bar.label }}</span>
            <div class="css-bar-track">
              <div class="css-bar-fill" :style="{ width: bar.width + '%', background: bar.color }"></div>
            </div>
            <span class="css-bar-count">{{ bar.count }}</span>
          </div>
        </div>
      </div>
      <div class="card">
        <h3>Répartition des vulnérabilités</h3>
        <div class="css-bars mt-16">
          <div v-if="!vulns.list.length" class="empty-state">Aucune vulnérabilité</div>
          <div v-for="bar in vulnBars" :key="bar.label" class="css-bar-row">
            <span class="css-bar-label">{{ bar.label }}</span>
            <div class="css-bar-track">
              <div class="css-bar-fill" :style="{ width: bar.width + '%', background: bar.color }"></div>
            </div>
            <span class="css-bar-count">{{ bar.count }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Exposition Internet -->
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

.risk-bar-bg { height: 14px; background: var(--color-border); border-radius: 999px; overflow: hidden; }
.risk-bar-fill { height: 100%; border-radius: 999px; transition: width 0.6s ease; }
.risk-bar-labels { display: flex; justify-content: space-between; font-size: 12px; color: var(--color-text-muted); margin-top: 6px; }

.risk-breakdown { display: flex; gap: 20px; }
.breakdown-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--color-text-muted); }

.css-bars { display: flex; flex-direction: column; gap: 10px; }
.css-bar-row { display: flex; align-items: center; gap: 10px; }
.css-bar-label { width: 90px; font-size: 13px; color: var(--color-text-muted); flex-shrink: 0; }
.css-bar-track { flex: 1; height: 20px; background: var(--color-border); border-radius: 4px; overflow: hidden; }
.css-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
.css-bar-count { width: 24px; text-align: right; font-size: 13px; font-weight: 600; flex-shrink: 0; }

.exposure-bars { display: flex; flex-direction: column; gap: 12px; }
.exposure-row { display: flex; align-items: center; gap: 12px; }
.exposure-label { width: 80px; font-size: 13px; }
.exposure-track { flex: 1; height: 24px; background: var(--color-border); border-radius: 4px; overflow: hidden; }
.exposure-fill { height: 100%; border-radius: 4px; transition: width 0.6s; }
.exposure-fill.exposed { background: #ef4444; }
.exposure-fill.internal { background: #10b981; }
.exposure-count { width: 30px; text-align: right; font-size: 13px; font-weight: 600; }
</style>
