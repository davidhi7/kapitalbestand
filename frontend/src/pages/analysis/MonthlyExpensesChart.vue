<script setup lang="ts">
import {
    CategoryScale,
    Chart,
    ChartData,
    ChartOptions,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    Title,
    Tooltip
} from 'chart.js';
import colors from 'tailwindcss/colors';
import { ref, watch } from 'vue';
import { Line } from 'vue-chartjs';

import { format_currency, format_year_month } from '@/common';
import { useAnalysisResultStore } from '@/stores/AnalysisResultStore';
import type { MonthlySummary } from '@backend-types/AnalysisTypes';

Chart.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);

const props = defineProps<{ year: number }>();

const AnalysisResultStore = useAnalysisResultStore();

async function createChartData(): Promise<ChartData<'line'> | null> {
    const report = await AnalysisResultStore.getYearlyReport(props.year);
    if (report) {
        const labels = [];
        for (let month = 0; month < 12; month++) {
            labels[month] = format_year_month({ date: new Date(props.year, month, 1), style: 'iso' });
        }
        const datasets: ChartData<'line'>['datasets'] = [
            {
                label: 'Ausgaben',
                data: report.map((row: MonthlySummary[0]) => row.oneoff.expenses + row.monthly.expenses),
                borderColor: colors.red[600],
                backgroundColor: colors.red[600]
            },
            {
                label: 'Einkommen',
                data: report.map((row: MonthlySummary[0]) => row.oneoff.incomes + row.monthly.incomes),
                borderColor: colors.green[700],
                backgroundColor: colors.green[700]
            },
            {
                label: 'Bilanz',
                data: report.map(
                    (row: MonthlySummary[0]) =>
                        row.oneoff.incomes + row.monthly.incomes - row.oneoff.expenses - row.monthly.expenses
                ),
                borderColor: colors.violet[700],
                backgroundColor: colors.violet[700]
            }
        ];
        return {
            labels,
            datasets
        };
    }
    return null;
}

const chartData = ref<ChartData<'line'> | null>();
watch(
    () => props.year,
    async () => {
        chartData.value = await createChartData();
    },
    { immediate: true }
);

const options: ChartOptions<'line'> = {
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                callback: format_currency
            }
        }
    }
};
</script>

<template>
    <Line v-if="chartData != null" :data="chartData" :options="options"></Line>
</template>
