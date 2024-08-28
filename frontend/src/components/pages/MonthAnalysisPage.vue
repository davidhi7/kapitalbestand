<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

import { MonthlySummary } from '@backend-types/AnalysisTypes';

import { longYearMonthFormat, shortYearMonthFormat } from '@/common';
import Card from '@/components/analysis/Card.vue';
import MonthlyExpensesChart from '@/components/analysis/monthly/MonthlyExpensesChart.vue';
import MonthlyExpensesStats from '@/components/analysis/monthly/MonthlyExpensesStats.vue';
import { useAnalysisResultStore } from '@/stores/AnalysisResultStore';

const route = useRoute();
const AnalysisResultStore = useAnalysisResultStore();
const report = ref<MonthlySummary | null>();

const currentDate = new Date();
const year = ref<number>(currentDate.getFullYear());
const month = ref<number>(currentDate.getMonth());

watch(
    () => route.params,
    async () => {
        year.value = route.params.year ? Number(route.params.year) : currentDate.getFullYear();
        month.value = route.params.month ? Number(route.params.month) - 1 : currentDate.getMonth();
        report.value = await AnalysisResultStore.getYearlyReport(year.value);
    },
    {
        deep: true,
        immediate: true
    }
);

function moveMonth(value: number): { year: number; month: number } {
    let newMonth = month.value + value;
    let newYear = year.value;
    if (newMonth < 0) {
        newYear--;
        newMonth = 11;
    } else if (newMonth > 11) {
        newYear++;
        newMonth = 0;
    }
    return { year: newYear, month: newMonth };
}

const monthBefore = computed(() => moveMonth(-1));
const monthAfter = computed(() => moveMonth(1));
const currentMonthSelected = computed(() => {
    return year.value === currentDate.getFullYear() && month.value === currentDate.getMonth();
});
</script>

<template>
    <main class="mx-2 space-y-8">
        <header class="grid grid-cols-2 justify-between gap-2 sm:flex">
            <RouterLink
                :to="`/analysis/${monthBefore.year}/${String(monthBefore.month + 1).padStart(2, '0')}`"
                class="row-[2] flex items-center gap-1"
            >
                <span class="material-symbols-outlined relative -bottom-0.5">navigate_before</span>
                <span>{{
                    shortYearMonthFormat.format(new Date(monthBefore.year, monthBefore.month))
                }}</span>
            </RouterLink>

            <h1 class="col-span-2">
                {{ longYearMonthFormat.format(new Date(monthBefore.year, monthBefore.month)) }}
            </h1>

            <div class="row-[2] flex justify-end">
                <RouterLink
                    v-if="!currentMonthSelected"
                    to="/analysis"
                    class="flex items-center gap-1"
                >
                    <span>heute</span>
                </RouterLink>
                <div
                    v-if="!currentMonthSelected"
                    class="mx-2 my-auto h-6 w-px bg-main opacity-50"
                />
                <RouterLink
                    :to="`/analysis/${monthAfter.year}/${String(monthAfter.month + 1).padStart(2, '0')}`"
                    class="flex items-center gap-1 text-right"
                >
                    <span>
                        {{
                            shortYearMonthFormat.format(
                                new Date(new Date(monthAfter.year, monthAfter.month))
                            )
                        }}
                    </span>
                    <span class="material-symbols-outlined relative -bottom-0.5">
                        navigate_next
                    </span>
                </RouterLink>
            </div>
        </header>
        <div v-if="report" class="flex flex-wrap justify-around gap-4">
            <Card class="grow">
                <MonthlyExpensesStats :year="year" :month="month" :report="report" />
            </Card>
            <Card class="min-h-[30rem] grow">
                <MonthlyExpensesChart :year="year" :report="report" />
            </Card>
        </div>
    </main>
</template>
