<script setup>
import { inject } from 'vue';
const frequency = inject('frequency')
</script>

<template>
    <tr class="contents">
        <th v-if="frequency === 'oneoff'">Datum</th>
        <th v-if="frequency === 'monthly'">erster Monat</th>
        <th v-if="frequency === 'monthly'">letzter Monat</th>
        <th>Kategorie</th>
        <th>Betrag</th>
        <th class="msm:hidden">Aktionen</th>
    </tr>
</template>

<style scoped lang="less">
th {
    @apply text-center p-2 text-xl bg-header-bg dark:bg-header-bg-dark font-semibold text-main-dark;
}
</style>
