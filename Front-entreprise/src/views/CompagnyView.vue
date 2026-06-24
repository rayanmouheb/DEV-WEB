<script setup>
import { ref, watch, computed } from 'vue'
import { useCompanyStore } from '../stores/company.js'
import { useNotificationsStore } from '../stores/notifications.js'

const store = useCompanyStore()
const notif = useNotificationsStore()

const showForm = ref(false)
const editing = ref(false)
const form = ref(emptyForm())

function emptyForm() {
  return { name: '', sector: '', employee_count: 0, server_count: 0, client_count: 0, exposed_services: [] }
}

const SERVICE_OPTIONS = ['HTTP', 'HTTPS', 'SMTP', 'FTP', 'SSH', 'RDP', 'DNS', 'VPN', 'API REST']

function openCreate() {
  form.value = emptyForm()
  editing.value = false
  showForm.value = true
}

function openEdit() {
  if (!store.selected) return
  form.value = {
    name: store.selected.name,
    sector: store.selected.sector,
    employee_count: store.selected.employee_count,
    server_count: store.selected.server_count,
    client_count: store.selected.client_count,
    exposed_services: [...(store.selected.exposed_services ?? [])],
  }
  editing.value = true
  showForm.value = true
}

function toggleService(s) {
  const idx = form.value.exposed_services.indexOf(s)
  if (idx >= 0) form.value.exposed_services.splice(idx, 1)
  else form.value.exposed_services.push(s)
}

async function submit() {
  try {
    if (editing.value) {
      await store.update(store.selectedId, form.value)
      notif.success('Entreprise mise à jour')
    } else {
      await store.create(form.value)
      notif.success('Entreprise créée')
    }
    showForm.value = false
  } catch (e) {
    notif.error(e.message)
  }
}

async function deleteCompany() {
  if (!confirm(`Supprimer "${store.selected?.name}" ? Cette action est irréversible.`)) return
  try {
    await store.remove(store.selectedId)
    notif.success('Entreprise supprimée')
  } catch (e) {
    notif.error(e.message)
  }
}

const sectorRisk = computed(() => {
  const s = store.selected?.sector?.toLowerCase() ?? ''
  if (s.includes('santé') || s.includes('médical')) return 'Secteur à forte réglementation (RGPD, HDS)'
  if (s.includes('finance') || s.includes('banque')) return 'Secteur soumis aux normes PCI-DSS'
  if (s.includes('défense') || s.includes('militaire')) return 'Secteur critique – exigences ANSSI'
  return 'Secteur standard – bonnes pratiques recommandées'
})
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">🏢 Gestion de l'entreprise</div>
        <div class="page-subtitle">Configurez votre entreprise fictive et son infrastructure</div>
      </div>
      <button class="btn btn-primary" @click="openCreate">+ Nouvelle entreprise</button>
    </div>

    <div v-if="store.companies.length > 1" class="company-selector">
      <label>Entreprise active :</label>
      <select class="form-control" @change="e => store.select(+e.target.value)">
        <option v-for="c in store.companies" :key="c.id" :value="c.id" :selected="c.id === store.selectedId">
          {{ c.name }}
        </option>
      </select>
    </div>

    <div v-if="!store.selected && !store.loading" class="empty-state">
      <div style="font-size: 48px;">🏢</div>
      <p>Aucune entreprise configurée.</p>
      <button class="btn btn-primary mt-16" @click="openCreate">Créer une entreprise</button>
    </div>

    <div v-else-if="store.selected" class="company-detail">
      <div class="detail-header">
        <div>
          <h2>{{ store.selected.name }}</h2>
          <span class="sector-badge">{{ store.selected.sector }}</span>
        </div>
        <div class="detail-actions">
          <button class="btn btn-secondary" @click="openEdit">✏️ Modifier</button>
          <button class="btn btn-danger" @click="deleteCompany">🗑️ Supprimer</button>
        </div>
      </div>

      <div class="grid-3 mt-16">
        <div class="stat-card">
          <div class="stat-value">{{ store.selected.employee_count }}</div>
          <div class="stat-label">👥 Employés</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ store.selected.server_count }}</div>
          <div class="stat-label">🖥️ Serveurs</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ store.selected.client_count }}</div>
          <div class="stat-label">💻 Postes clients</div>
        </div>
      </div>

      <div class="card mt-16">
        <h3>Services exposés sur Internet</h3>
        <div class="services-list mt-16">
          <span
            v-for="s in (store.selected.exposed_services ?? [])"
            :key="s"
            class="service-tag"
          >{{ s }}</span>
          <span v-if="!store.selected.exposed_services?.length" class="text-muted">Aucun service exposé</span>
        </div>
      </div>

      <div class="card mt-16">
        <h3>Analyse sectorielle</h3>
        <p class="mt-16 sector-info">ℹ️ {{ sectorRisk }}</p>
      </div>

      <div class="card mt-16">
        <h3>Informations générales</h3>
        <div class="info-grid mt-16">
          <div><span class="info-label">Créée le</span><span>{{ store.selected.created_at ? new Date(store.selected.created_at).toLocaleDateString('fr-FR') : '—' }}</span></div>
          <div><span class="info-label">ID</span><span>#{{ store.selected.id }}</span></div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showForm" class="modal-backdrop" @click.self="showForm = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">{{ editing ? 'Modifier l\'entreprise' : 'Nouvelle entreprise' }}</span>
          <button class="modal-close" @click="showForm = false">✕</button>
        </div>
        <form @submit.prevent="submit" class="flex flex-col gap-12">
          <div class="form-group">
            <label>Nom de l'entreprise *</label>
            <input v-model="form.name" class="form-control" placeholder="ex: TechNova SAS" required />
          </div>
          <div class="form-group">
            <label>Secteur d'activité *</label>
            <input v-model="form.sector" class="form-control" placeholder="ex: Informatique & Services" required />
          </div>
          <div class="grid-3">
            <div class="form-group">
              <label>Nb. employés</label>
              <input v-model.number="form.employee_count" type="number" min="0" class="form-control" />
            </div>
            <div class="form-group">
              <label>Nb. serveurs</label>
              <input v-model.number="form.server_count" type="number" min="0" class="form-control" />
            </div>
            <div class="form-group">
              <label>Nb. postes</label>
              <input v-model.number="form.client_count" type="number" min="0" class="form-control" />
            </div>
          </div>
          <div class="form-group">
            <label>Services exposés sur Internet</label>
            <div class="services-check">
              <label v-for="s in SERVICE_OPTIONS" :key="s" class="service-check-item">
                <input type="checkbox" :checked="form.exposed_services.includes(s)" @change="toggleService(s)" />
                {{ s }}
              </label>
            </div>
          </div>
          <div class="flex gap-8 mt-16">
            <button type="submit" class="btn btn-primary">
              {{ editing ? 'Enregistrer' : 'Créer' }}
            </button>
            <button type="button" class="btn btn-secondary" @click="showForm = false">Annuler</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.company-selector { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; font-size: 14px; }
.company-selector select { max-width: 280px; }
.detail-header { display: flex; align-items: flex-start; justify-content: space-between; }
.detail-actions { display: flex; gap: 8px; }
.sector-badge { display: inline-block; margin-top: 6px; padding: 3px 10px; background: #dbeafe; color: #1d4ed8; border-radius: 999px; font-size: 13px; }
.services-list { display: flex; flex-wrap: wrap; gap: 8px; }
.service-tag { padding: 4px 10px; background: #f0fdf4; border: 1px solid #86efac; color: #166534; border-radius: 999px; font-size: 13px; font-weight: 500; }
.text-muted { color: var(--color-text-muted); font-size: 14px; }
.sector-info { color: var(--color-text-muted); font-size: 14px; }
.info-grid { display: flex; flex-direction: column; gap: 10px; }
.info-grid > div { display: flex; gap: 12px; font-size: 14px; }
.info-label { color: var(--color-text-muted); min-width: 100px; }
.services-check { display: flex; flex-wrap: wrap; gap: 10px; }
.service-check-item { display: flex; align-items: center; gap: 5px; font-size: 14px; cursor: pointer; }
</style>
