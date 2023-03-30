<script setup lang="ts">
import { Line } from 'vue-chartjs';
import { CategoryScale, Chart, ChartData, ChartOptions, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';
import { useAnalysisResultStore } from '@/stores/AnalysisResultStore';
import { ref } from 'vue';
import { format_currency, format_year_month } from '@/common';
import type { MonthlySummary } from '@backend-types/AnalysisTypes';

Chart.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);

const props = defineProps({
    year: {
        type: Number,
        required: true
    }
});


const AnalysisResultStore = useAnalysisResultStore();
const report = await AnalysisResultStore.getYearlyReport(props.year);

const data = ref();
if (report) {
    const labels = [];
    for (let month = 0; month < 12; month++) {
        labels[month] = format_year_month({ date: new Date(props.year, month, 1), style: 'iso' });
    }
    const datasets = [
        {
            label: 'Ausgaben',
            data: report.map((row: MonthlySummary[0]) => row.oneoff.expenses + row.monthly.expenses)
        },
        {
            label: 'Einkommen',
            data: report.map((row: MonthlySummary[0]) => row.oneoff.incomes + row.monthly.incomes)
        }
    ];
    data.value = {
        labels,
        datasets
    };
}

const options: ChartOptions = {
    scales: {
        y: {
            min: 0,
            ticks: {
                callback: format_currency
            }
        }
    },
    borderColor: '#FFF'
}
</script>

<template>
    <Line v-if="data" :data="data" :options="options"></Line>
    <div v-else>
        Keine Daten verfügbar
    </div>
</template>
