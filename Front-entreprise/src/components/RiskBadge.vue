<script setup>
defineProps({ level: String, score: Number })
const labels = { eleve: 'Élevé', moyen: 'Moyen', faible: 'Faible', none: 'Aucun' }
</script>

<template>
  <span :class="['badge', `badge-${level ?? 'none'}`]">
    {{ labels[level] ?? 'Aucun' }} {{ score !== undefined ? `(${score})` : '' }}
  </span>
</template>
