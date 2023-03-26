<script setup>
import { computed, onBeforeMount, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { Line } from 'vue-chartjs';
import { CategoryScale, Chart, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';

import { format_year_month } from '@/common';
import { useAnalysisResultStore } from '@/stores/AnalysisResultStore';

Chart.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);

const route = useRoute();
const AnalysisResultStore = useAnalysisResultStore();
const data = ref({});

const date = ref(null);

function refreshMonth({ year, month }) {
    const currentDate = new Date();
    year ??= currentDate.getFullYear();
    month = month ? month - 1 : currentDate.getMonth();

    date.value = new Date(year, month, 1);
}

const monthBefore = computed(() => {
    const clone = new Date(date.value.getTime());
    clone.setMonth(clone.getMonth() - 1);
    return clone;
});
const monthAfter = computed(() => {
    const clone = new Date(date.value.getTime());
    clone.setMonth(clone.getMonth() + 1);
    return clone;
});

onBeforeMount(async () => {
    refreshMonth(route.params);
    await AnalysisResultStore.fetchYearAnalysis(date.value.getFullYear());

    const labels = [];
    for (let month = 0; month < 12; month++) {
        labels[month] = format_year_month({ date: new Date(date.value.getFullYear(), month, 1), style: 'iso' });
    }

    let summary = AnalysisResultStore.years[date.value.getFullYear()];
    data.value = {
        labels,
        datasets: [
            {
                label: 'Ausgaben',
                data: summary.map(row => row.oneoff.expenses)
            },
            {
                label: 'Einkommen',
                data: summary.map(row => row.oneoff.incomes)
            }
        ]
    };
});
watch(() => route.params, refreshMonth);
</script>

<template>
    <div class='flex gap-2 justify-between'>
        <RouterLink
            :to="`/analysis/${monthBefore.getFullYear()}/${String(monthBefore.getMonth() + 1).padStart(2, '0')}`"
            class='flex items-center gap-1 ln'>
            <span class='material-symbols-outlined'>navigate_before</span>
            <span>{{ format_year_month({ date: monthBefore, style: 'short' }) }}</span>
        </RouterLink>

        <h1 class='flex-1'>{{ format_year_month({ date, style: 'long' }) }}</h1>

        <RouterLink :to="`/analysis/${monthAfter.getFullYear()}/${String(monthAfter.getMonth() + 1).padStart(2, '0')}`"
            class='flex items-center gap-1 text-right ln'>
            <span class='ln'>{{ format_year_month({ date: monthAfter, style: 'short' }) }}</span>
            <span class='material-symbols-outlined'>navigate_next</span>
        </RouterLink>
    </div>
    <Line v-if='data.labels' :data='data' :options='{}' />
</template>
