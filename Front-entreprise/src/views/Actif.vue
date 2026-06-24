<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAssetsStore } from '../stores/assets.js'
import { useCompanyStore } from '../stores/company.js'
import { useNotificationsStore } from '../stores/notifications.js'

const assets = useAssetsStore()
const company = useCompanyStore()
const notif = useNotificationsStore()

const showForm = ref(false)
const editingId = ref(null)
const form = ref(emptyForm())
const filterType = ref('')

const TYPE_LABELS = {
  serveur_web: 'Serveur Web',
  base_de_donnees: 'Base de données',
  poste_utilisateur: 'Poste utilisateur',
  routeur: 'Routeur',
  pare_feu: 'Pare-feu',
  application_metier: 'Application métier',
}
const TYPE_ICONS = {
  serveur_web: '🖥️',
  base_de_donnees: '🗄️',
  poste_utilisateur: '💻',
  routeur: '🌐',
  pare_feu: '🔥',
  application_metier: '⚙️',
}

function emptyForm() {
  return { name: '', type: 'serveur_web', is_internet_exposed: false }
}

onMounted(() => {
  if (company.selectedId) assets.fetchByCompany(company.selectedId)
})

const filtered = computed(() =>
  filterType.value ? assets.list.filter(a => a.type === filterType.value) : assets.list
)

function openCreate() {
  form.value = emptyForm()
  editingId.value = null
  showForm.value = true
}

function openEdit(a) {
  form.value = { name: a.name, type: a.type, is_internet_exposed: !!a.is_internet_exposed }
  editingId.value = a.id
  showForm.value = true
}

async function submit() {
  if (!company.selectedId) return notif.error('Aucune entreprise sélectionnée')
  try {
    if (editingId.value) {
      await assets.update(editingId.value, form.value)
      notif.success('Actif mis à jour')
    } else {
      await assets.create({ ...form.value, company_id: company.selectedId })
      notif.success('Actif ajouté')
    }
    showForm.value = false
  } catch (e) {
    notif.error(e.message)
  }
}

async function remove(a) {
  if (!confirm(`Supprimer "${a.name}" ? Ses vulnérabilités seront aussi supprimées.`)) return
  try {
    await assets.remove(a.id)
    notif.success('Actif supprimé')
  } catch (e) {
    notif.error(e.message)
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">💻 Gestion des actifs</div>
        <div class="page-subtitle">
          {{ assets.list.length }} actif(s) — Entreprise : {{ company.selected?.name ?? '–' }}
        </div>
      </div>
      <button class="btn btn-primary" @click="openCreate">+ Ajouter un actif</button>
    </div>

    <div class="filters">
      <button
        v-for="(label, type) in { '': 'Tous', ...TYPE_LABELS }"
        :key="type"
        :class="['filter-btn', filterType === type ? 'active' : '']"
        @click="filterType = type"
      >
        {{ type ? TYPE_ICONS[type] : '📋' }} {{ label }}
      </button>
    </div>

    <div v-if="assets.loading" class="empty-state">Chargement...</div>

    <div v-else-if="filtered.length === 0" class="empty-state">
      <div style="font-size: 48px;">💻</div>
      <p>{{ assets.list.length ? 'Aucun actif de ce type.' : 'Aucun actif. Commencez par en ajouter un.' }}</p>
      <button class="btn btn-primary mt-16" @click="openCreate">+ Ajouter un actif</button>
    </div>

    <div v-else class="assets-grid">
      <div v-for="a in filtered" :key="a.id" class="asset-card">
        <div class="asset-header">
          <div class="asset-icon">{{ TYPE_ICONS[a.type] }}</div>
          <div class="asset-info">
            <div class="asset-name">{{ a.name }}</div>
            <div class="asset-type">{{ TYPE_LABELS[a.type] }}</div>
          </div>
          <div class="asset-actions">
            <button class="btn btn-sm btn-secondary" @click="openEdit(a)">✏️</button>
            <button class="btn btn-sm btn-danger" @click="remove(a)">🗑️</button>
          </div>
        </div>
        <div class="asset-footer">
          <span v-if="a.is_internet_exposed" class="badge badge-eleve">🌐 Exposé Internet</span>
          <span v-else class="badge badge-faible">🔒 Interne</span>
          <span class="asset-date">{{ new Date(a.created_at).toLocaleDateString('fr-FR') }}</span>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showForm" class="modal-backdrop" @click.self="showForm = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">{{ editingId ? 'Modifier l\'actif' : 'Nouvel actif' }}</span>
          <button class="modal-close" @click="showForm = false">✕</button>
        </div>
        <form @submit.prevent="submit" class="flex flex-col gap-12">
          <div class="form-group">
            <label>Nom de l'actif *</label>
            <input v-model="form.name" class="form-control" placeholder="ex: Serveur Web principal" required />
          </div>
          <div class="form-group">
            <label>Type *</label>
            <select v-model="form.type" class="form-control">
              <option v-for="(label, type) in TYPE_LABELS" :key="type" :value="type">
                {{ TYPE_ICONS[type] }} {{ label }}
              </option>
            </select>
          </div>
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.is_internet_exposed" />
            🌐 Exposé sur Internet
          </label>
          <div class="flex gap-8 mt-16">
            <button type="submit" class="btn btn-primary">{{ editingId ? 'Enregistrer' : 'Ajouter' }}</button>
            <button type="button" class="btn btn-secondary" @click="showForm = false">Annuler</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.filter-btn {
  padding: 5px 12px;
  border: 1px solid var(--color-border);
  background: var(--color-card);
  color: var(--color-text);
  border-radius: 999px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.filter-btn:hover, .filter-btn.active { background: #2563eb; color: white; border-color: #2563eb; }

.assets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }

.asset-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 16px;
  transition: box-shadow 0.2s;
}
.asset-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }

.asset-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
.asset-icon { font-size: 28px; }
.asset-info { flex: 1; }
.asset-name { font-weight: 600; font-size: 15px; }
.asset-type { font-size: 12px; color: var(--color-text-muted); margin-top: 2px; }
.asset-actions { display: flex; gap: 4px; }

.asset-footer { display: flex; align-items: center; justify-content: space-between; }
.asset-date { font-size: 12px; color: var(--color-text-muted); }

.checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }
</style>
