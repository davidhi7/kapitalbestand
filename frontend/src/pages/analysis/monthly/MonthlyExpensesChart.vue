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
import { computed } from 'vue';
import { Line } from 'vue-chartjs';

import { format_currency, format_year_month } from '@/common';
import type { MonthlySummary } from '@backend-types/AnalysisTypes';

Chart.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);

const props = defineProps<{ year: number; report: MonthlySummary }>();
const chartData = computed(() => {
    const labels = [];
    for (let month = 0; month < 12; month++) {
        labels[month] = format_year_month({ date: new Date(props.year, month, 1), style: 'iso' });
    }
    const datasets: ChartData<'line'>['datasets'] = [
        {
            label: 'Ausgaben',
            data: props.report.map(
                (row: MonthlySummary[0]) => row.oneoff.expenses + row.monthly.expenses
            ),
            borderColor: colors.red[600],
            backgroundColor: colors.red[600]
        },
        {
            label: 'Einkommen',
            data: props.report.map(
                (row: MonthlySummary[0]) => row.oneoff.incomes + row.monthly.incomes
            ),
            borderColor: colors.green[700],
            backgroundColor: colors.green[700]
        },
        {
            label: 'Bilanz',
            data: props.report.map((row: MonthlySummary[0]) => row.balance),
            borderColor: colors.violet[700],
            backgroundColor: colors.violet[700]
        }
    ];
    return {
        labels,
        datasets
    };
});

const options: ChartOptions<'line'> = {
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                callback: format_currency
            }
        }
    },
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'right'
        },
        tooltip: {
            callbacks: {
                label: (context) => {
                    let label = context.dataset.label || '';

                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed.y !== null) {
                        label += format_currency(context.parsed.y);
                    }
                    return label;
                }
            }
        }
    }
};
</script>

<template>
    <Line :data="chartData" :options="options"></Line>
</template>
