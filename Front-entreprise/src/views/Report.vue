<script setup>
import { ref, onMounted } from 'vue'
import { useCompanyStore } from '../stores/company.js'
import { useRiskStore } from '../stores/risk.js'
import { api } from '../services/api.js'
import RiskBadge from '../components/RiskBadge.vue'

const company = useCompanyStore()
const risk = useRiskStore()

const report = ref(null)
const loading = ref(false)

const TYPE_LABELS = {
  serveur_web: 'Serveur Web', base_de_donnees: 'Base de données',
  poste_utilisateur: 'Poste utilisateur', routeur: 'Routeur',
  pare_feu: 'Pare-feu', application_metier: 'Application métier',
}
const TYPE_ICONS = {
  serveur_web: '🖥️', base_de_donnees: '🗄️', poste_utilisateur: '💻',
  routeur: '🌐', pare_feu: '🔥', application_metier: '⚙️',
}

onMounted(() => loadReport())

async function loadReport() {
  if (!company.selectedId) return
  loading.value = true
  try {
    report.value = await api.get(`/report/${company.selectedId}`)
  } catch (e) {
    console.error(e.message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">📋 Rapport de sécurité</div>
        <div class="page-subtitle">{{ company.selected?.name ?? '–' }}</div>
      </div>
      <button class="btn btn-secondary" @click="loadReport" :disabled="loading">🔄 Actualiser</button>
    </div>

    <div v-if="loading" class="empty-state">Génération du rapport...</div>
    <div v-else-if="!report" class="empty-state">
      <div style="font-size:48px;">📋</div>
      <p>Aucune entreprise sélectionnée ou erreur de chargement.</p>
    </div>

    <div v-else class="report" id="report-content">

      <!-- En-tête rapport -->
      <div class="report-header card">
        <div class="report-title-row">
          <div>
            <h2>Rapport de sécurité cybernétique</h2>
            <p class="text-muted">Généré le {{ new Date(report.generated_at).toLocaleString('fr-FR') }}</p>
          </div>
          <RiskBadge :level="report.risk.level" :score="report.risk.score" />
        </div>
      </div>

      <!-- Section 1: Entreprise -->
      <div class="card mt-16">
        <h3>1. Présentation de l'entreprise</h3>
        <div class="info-table mt-16">
          <div class="info-row"><span>Nom</span><strong>{{ report.company.name }}</strong></div>
          <div class="info-row"><span>Secteur</span><strong>{{ report.company.sector }}</strong></div>
          <div class="info-row"><span>Effectifs</span><strong>{{ report.company.employee_count }} employés</strong></div>
          <div class="info-row"><span>Infrastructure</span><strong>{{ report.company.server_count }} serveurs / {{ report.company.client_count }} postes</strong></div>
          <div class="info-row">
            <span>Services exposés</span>
            <div>
              <span v-if="!report.company.exposed_services?.length" class="text-muted">Aucun</span>
              <span v-for="s in report.company.exposed_services" :key="s" class="service-tag">{{ s }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: Score de risque -->
      <div class="card mt-16">
        <h3>2. Évaluation du risque cyber</h3>
        <div class="risk-summary mt-16">
          <div class="risk-metric">
            <div class="risk-value">{{ report.risk.score }}</div>
            <div class="risk-label">Score total</div>
          </div>
          <div class="risk-metric">
            <div class="risk-value">{{ report.risk.assetCount }}</div>
            <div class="risk-label">Actifs</div>
          </div>
          <div class="risk-metric">
            <div class="risk-value">{{ report.risk.vulnCount }}</div>
            <div class="risk-label">Vulnérabilités</div>
          </div>
          <div class="risk-metric">
            <div class="risk-value">{{ report.risk.exposedCount }}</div>
            <div class="risk-label">Exposés Internet</div>
          </div>
          <div class="risk-metric">
            <div class="risk-value">{{ report.risk.criticalityCount.eleve }}</div>
            <div class="risk-label" style="color:#dc2626">Critiques</div>
          </div>
        </div>
      </div>

      <!-- Section 3: Inventaire -->
      <div class="card mt-16">
        <h3>3. Inventaire des actifs et vulnérabilités</h3>
        <div v-for="a in report.assets" :key="a.id" class="asset-section mt-16">
          <div class="asset-header-report">
            <span class="asset-icon-sm">{{ TYPE_ICONS[a.type] }}</span>
            <strong>{{ a.name }}</strong>
            <span class="text-muted" style="font-size:12px;">{{ TYPE_LABELS[a.type] }}</span>
            <span v-if="a.is_internet_exposed" class="badge badge-eleve" style="font-size:11px;">Internet</span>
          </div>
          <div v-if="a.vulnerabilities.length === 0" class="no-vuln">✅ Aucune vulnérabilité détectée</div>
          <div v-else class="vuln-list">
            <div v-for="v in a.vulnerabilities" :key="v.id" class="vuln-item">
              <span :class="['badge', `badge-${v.criticality}`]" style="font-size:11px;">{{ { faible:'Faible',moyen:'Moyen',eleve:'Élevé' }[v.criticality] }}</span>
              <div>
                <div class="vuln-name">{{ v.name }}</div>
                <div v-if="v.description" class="vuln-desc">{{ v.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 4: Recommandations -->
      <div class="card mt-16">
        <h3>4. Recommandations de sécurité</h3>
        <div class="recommendations mt-16">
          <div v-for="(rec, i) in report.recommendations" :key="i" class="rec-item">
            <span class="rec-num">{{ i + 1 }}</span>
            <span>{{ rec }}</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.text-muted { color: var(--color-text-muted); font-size: 13px; }
.report-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.info-table { display: flex; flex-direction: column; gap: 10px; }
.info-row { display: flex; gap: 20px; font-size: 14px; border-bottom: 1px solid var(--color-border); padding-bottom: 8px; }
.info-row > span:first-child { color: var(--color-text-muted); min-width: 130px; }
.service-tag { display: inline-block; margin: 0 4px 4px 0; padding: 2px 8px; background: #f0fdf4; border: 1px solid #86efac; color: #166534; border-radius: 999px; font-size: 12px; }

.risk-summary { display: flex; gap: 24px; flex-wrap: wrap; }
.risk-metric { text-align: center; }
.risk-value { font-size: 36px; font-weight: 700; }
.risk-label { font-size: 12px; color: var(--color-text-muted); }

.asset-section { border: 1px solid var(--color-border); border-radius: 8px; padding: 14px; }
.asset-header-report { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.asset-icon-sm { font-size: 20px; }
.no-vuln { font-size: 13px; color: #059669; }
.vuln-list { display: flex; flex-direction: column; gap: 8px; }
.vuln-item { display: flex; gap: 10px; align-items: flex-start; }
.vuln-name { font-size: 13px; font-weight: 500; }
.vuln-desc { font-size: 12px; color: var(--color-text-muted); margin-top: 2px; }

.recommendations { display: flex; flex-direction: column; gap: 10px; }
.rec-item { display: flex; gap: 12px; align-items: flex-start; font-size: 14px; }
.rec-num { width: 26px; height: 26px; background: #2563eb; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
</style>
