<script setup>
import { ref, onMounted, computed } from 'vue'
import { useVulnerabilitiesStore } from '../stores/vulnerabilities.js'
import { useAssetsStore } from '../stores/assets.js'
import { useCompanyStore } from '../stores/company.js'
import { useNotificationsStore } from '../stores/notifications.js'

const vulns = useVulnerabilitiesStore()
const assets = useAssetsStore()
const company = useCompanyStore()
const notif = useNotificationsStore()

const showForm = ref(false)
const editingId = ref(null)
const filterCriticality = ref('')
const filterAsset = ref('')
const form = ref(emptyForm())

const CRITICALITY_LABELS = { faible: 'Faible', moyen: 'Moyen', eleve: 'Élevé' }
const VULNERABILITY_EXAMPLES = [
  'Logiciel obsolète', 'Mot de passe faible', 'Port exposé',
  'Absence de sauvegarde', 'Certificat SSL expiré', 'Firmware obsolète',
  'Configuration par défaut', 'Absence de chiffrement', 'Droits excessifs',
  'Absence de monitoring', 'Injection SQL potentielle', 'Absence d\'antivirus',
]

function emptyForm() {
  return { asset_id: '', name: '', description: '', criticality: 'moyen' }
}

onMounted(async () => {
  if (company.selectedId) {
    await Promise.all([
      vulns.fetchByCompany(company.selectedId),
      assets.fetchByCompany(company.selectedId),
    ])
    if (assets.list.length) form.value.asset_id = assets.list[0].id
  }
})

const filtered = computed(() => {
  let list = vulns.list
  if (filterCriticality.value) list = list.filter(v => v.criticality === filterCriticality.value)
  if (filterAsset.value) list = list.filter(v => v.asset_id === +filterAsset.value)
  return list
})

const assetMap = computed(() => Object.fromEntries(assets.list.map(a => [a.id, a])))

function openCreate() {
  form.value = emptyForm()
  if (assets.list.length) form.value.asset_id = assets.list[0].id
  editingId.value = null
  showForm.value = true
}

function openEdit(v) {
  form.value = { asset_id: v.asset_id, name: v.name, description: v.description ?? '', criticality: v.criticality }
  editingId.value = v.id
  showForm.value = true
}

async function submit() {
  if (!form.value.asset_id) return notif.error('Sélectionnez un actif')
  try {
    if (editingId.value) {
      await vulns.update(editingId.value, form.value)
      notif.success('Vulnérabilité mise à jour')
    } else {
      await vulns.create(form.value)
      notif.success('Vulnérabilité ajoutée')
    }
    showForm.value = false
  } catch (e) {
    notif.error(e.message)
  }
}

async function remove(v) {
  if (!confirm(`Supprimer la vulnérabilité "${v.name}" ?`)) return
  try {
    await vulns.remove(v.id)
    notif.success('Vulnérabilité supprimée')
  } catch (e) {
    notif.error(e.message)
  }
}

const TYPE_ICONS = {
  serveur_web: '🖥️', base_de_donnees: '🗄️', poste_utilisateur: '💻',
  routeur: '🌐', pare_feu: '🔥', application_metier: '⚙️',
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">🔍 Vulnérabilités</div>
        <div class="page-subtitle">
          {{ vulns.list.length }} vulnérabilité(s) —
          <span class="badge badge-eleve">{{ vulns.list.filter(v=>v.criticality==='eleve').length }} élevées</span>
          <span class="badge badge-moyen">{{ vulns.list.filter(v=>v.criticality==='moyen').length }} moyennes</span>
          <span class="badge badge-faible">{{ vulns.list.filter(v=>v.criticality==='faible').length }} faibles</span>
        </div>
      </div>
      <button class="btn btn-primary" @click="openCreate" :disabled="!assets.list.length">
        + Ajouter une vulnérabilité
      </button>
    </div>

    <div class="filters">
      <select class="form-control filter-select" v-model="filterCriticality">
        <option value="">Toutes les criticités</option>
        <option value="eleve">🔴 Élevé</option>
        <option value="moyen">🟡 Moyen</option>
        <option value="faible">🟢 Faible</option>
      </select>
      <select class="form-control filter-select" v-model="filterAsset">
        <option value="">Tous les actifs</option>
        <option v-for="a in assets.list" :key="a.id" :value="a.id">
          {{ TYPE_ICONS[a.type] }} {{ a.name }}
        </option>
      </select>
    </div>

    <div v-if="vulns.loading" class="empty-state">Chargement...</div>

    <div v-else-if="!assets.list.length" class="empty-state">
      <div style="font-size: 48px;">⚠️</div>
      <p>Ajoutez d'abord des actifs avant de définir des vulnérabilités.</p>
    </div>

    <div v-else-if="filtered.length === 0" class="empty-state">
      <div style="font-size: 48px;">🔍</div>
      <p>{{ vulns.list.length ? 'Aucune vulnérabilité correspondante.' : 'Aucune vulnérabilité définie.' }}</p>
      <button class="btn btn-primary mt-16" @click="openCreate">+ Ajouter</button>
    </div>

    <div v-else class="table-container">
      <table>
        <thead>
          <tr>
            <th>Vulnérabilité</th>
            <th>Actif</th>
            <th>Criticité</th>
            <th>Description</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in filtered" :key="v.id">
            <td><strong>{{ v.name }}</strong></td>
            <td>
              <span v-if="assetMap[v.asset_id]">
                {{ TYPE_ICONS[assetMap[v.asset_id].type] }} {{ assetMap[v.asset_id].name }}
              </span>
            </td>
            <td>
              <span :class="['badge', `badge-${v.criticality}`]">
                {{ CRITICALITY_LABELS[v.criticality] }}
              </span>
            </td>
            <td class="desc-cell">{{ v.description || '–' }}</td>
            <td class="date-cell">{{ new Date(v.created_at).toLocaleDateString('fr-FR') }}</td>
            <td>
              <div class="flex gap-8">
                <button class="btn btn-sm btn-secondary" @click="openEdit(v)">✏️</button>
                <button class="btn btn-sm btn-danger" @click="remove(v)">🗑️</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showForm" class="modal-backdrop" @click.self="showForm = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">{{ editingId ? 'Modifier la vulnérabilité' : 'Nouvelle vulnérabilité' }}</span>
          <button class="modal-close" @click="showForm = false">✕</button>
        </div>
        <form @submit.prevent="submit" class="flex flex-col gap-12">
          <div class="form-group">
            <label>Actif concerné *</label>
            <select v-model.number="form.asset_id" class="form-control">
              <option v-for="a in assets.list" :key="a.id" :value="a.id">
                {{ TYPE_ICONS[a.type] }} {{ a.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Nom de la vulnérabilité *</label>
            <input v-model="form.name" class="form-control" list="vuln-examples" placeholder="ex: Port 22 exposé" required />
            <datalist id="vuln-examples">
              <option v-for="ex in VULNERABILITY_EXAMPLES" :key="ex" :value="ex" />
            </datalist>
          </div>
          <div class="form-group">
            <label>Criticité *</label>
            <select v-model="form.criticality" class="form-control">
              <option value="faible">🟢 Faible</option>
              <option value="moyen">🟡 Moyen</option>
              <option value="eleve">🔴 Élevé</option>
            </select>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="form.description" class="form-control" rows="3" placeholder="Détails sur la vulnérabilité..."></textarea>
          </div>
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
.filters { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.filter-select { max-width: 220px; }
.desc-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; color: var(--color-text-muted); }
.date-cell { font-size: 13px; color: var(--color-text-muted); white-space: nowrap; }
</style>
