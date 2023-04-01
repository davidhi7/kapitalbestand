<script setup lang="ts">
import { computed } from 'vue';

import { format_currency } from '@/common';
import { MonthlySummary } from '@backend-types/AnalysisTypes';

const props = defineProps<{ year: number; month: number; report: MonthlySummary }>();
const monthData = computed(() => props.report[props.month]);
</script>

<template>
    <article class="flex flex-col gap-8">
        <div class="flex gap-4 items-end mx-8 pb-2 border-b-2 border-purple-400 justify-between">
            <span class="text-lg text-purple-200">Bilanz</span>
            <span class="text-purple-400 text-5xl sm:text-6xl font-light">
                {{ format_currency(monthData.balance) }}
            </span>
        </div>
        <div class="grid grid-cols-2 child:flex child:justify-center">
            <span class="text-tertiary-dark my-2">Ausgaben</span>
            <span class="text-tertiary-dark my-2">Einnahmen</span>
            <span class="text-red-400 text-3xl font-light">
                {{ format_currency(monthData.oneoff.expenses + monthData.monthly.expenses) }}
            </span>
            <span class="text-green-400 text-3xl font-light">
                {{ format_currency(monthData.oneoff.incomes + monthData.monthly.incomes) }}
            </span>

        </div>
    </article>
</template>
