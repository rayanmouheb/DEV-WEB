<script setup>
import { onMounted } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { useRiskStore } from '../stores/risk.js'
import { useCompanyStore } from '../stores/company.js'
import { useNotificationsStore } from '../stores/notifications.js'
import { computed } from 'vue'
import RiskBadge from '../components/RiskBadge.vue'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const risk = useRiskStore()
const company = useCompanyStore()
const notif = useNotificationsStore()

onMounted(() => {
  if (company.selectedId) risk.fetchHistory(company.selectedId)
})

async function deleteEntry(id) {
  if (!confirm('Supprimer cette entrée de l\'historique ?')) return
  try {
    await risk.deleteHistory(id)
    notif.success('Entrée supprimée')
  } catch (e) {
    notif.error(e.message)
  }
}

const chartData = computed(() => {
  const sorted = [...risk.history].reverse()
  return {
    labels: sorted.map(h => new Date(h.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })),
    datasets: [{
      label: 'Score de risque',
      data: sorted.map(h => h.score),
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37,99,235,0.1)',
      fill: true,
      tension: 0.3,
      pointBackgroundColor: sorted.map(h => ({ eleve:'#ef4444', moyen:'#f59e0b', faible:'#10b981', none:'#94a3b8' }[h.level])),
      pointRadius: 5,
    }],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true } },
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">🕐 Historique des analyses</div>
        <div class="page-subtitle">{{ risk.history.length }} analyse(s) — {{ company.selected?.name ?? '–' }}</div>
      </div>
    </div>

    <div v-if="!risk.history.length" class="empty-state">
      <div style="font-size:48px;">🕐</div>
      <p>Aucune analyse effectuée. Rendez-vous sur le Dashboard pour calculer le risque.</p>
    </div>

    <div v-else>
      <div class="card mb-16">
        <h3>Évolution du score dans le temps</h3>
        <div style="height: 250px; margin-top: 16px;">
          <Line :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Score</th>
              <th>Niveau</th>
              <th>Actifs</th>
              <th>Vulnérabilités</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in risk.history" :key="h.id">
              <td class="text-muted">{{ h.id }}</td>
              <td>{{ new Date(h.created_at).toLocaleString('fr-FR') }}</td>
              <td><strong>{{ h.score }}</strong></td>
              <td><RiskBadge :level="h.level" /></td>
              <td>{{ h.details?.assetCount ?? '–' }}</td>
              <td>{{ h.details?.vulnCount ?? '–' }}</td>
              <td>
                <button class="btn btn-sm btn-danger" @click="deleteEntry(h.id)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-muted { color: var(--color-text-muted); font-size: 13px; }
.mb-16 { margin-bottom: 16px; }
</style>
