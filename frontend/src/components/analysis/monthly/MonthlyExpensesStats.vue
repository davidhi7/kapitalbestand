<script setup lang="ts">
import { computed } from 'vue';

import { MonthlySummary } from '@backend-types/AnalysisTypes';

import { formatCurrency } from '@/common';

const props = defineProps<{ year: number; month: number; report: MonthlySummary }>();
const monthData = computed(() => props.report[props.month]);
</script>

<template>
    <article class="flex flex-col gap-8">
        <div class="mx-8 flex items-end justify-between gap-4 border-b-2 border-purple-400 pb-2">
            <span class="text-lg text-purple-200">Bilanz</span>
            <span class="text-5xl font-light text-purple-400 sm:text-6xl">
                {{ formatCurrency(monthData.balance) }}
            </span>
        </div>
        <div class="grid grid-cols-2 child:flex child:justify-center">
            <span class="text-tertiary-dark my-2">Ausgaben</span>
            <span class="text-tertiary-dark my-2">Einnahmen</span>
            <span class="text-3xl font-light text-red-400">
                {{ formatCurrency(monthData.oneoff.expenses + monthData.monthly.expenses) }}
            </span>
            <span class="text-3xl font-light text-green-400">
                {{ formatCurrency(monthData.oneoff.incomes + monthData.monthly.incomes) }}
            </span>
        </div>
    </article>
</template>
