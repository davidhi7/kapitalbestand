<script setup lang="ts">
import Button from 'primevue/button';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

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
            <Button
                as="router-link"
                :to="`/analysis/${monthBefore.year}/${String(monthBefore.month + 1).padStart(2, '0')}`"
                :label="shortYearMonthFormat.format(new Date(monthBefore.year, monthBefore.month))"
                icon="pi pi-chevron-left"
                text
                class="row-2"
            />

            <h1 class="col-span-2">
                {{ longYearMonthFormat.format(new Date(year, month)) }}
            </h1>

            <div class="row-2 flex justify-end gap-1">
                <Button
                    v-if="!currentMonthSelected"
                    as="router-link"
                    to="/analysis"
                    label="heute"
                    text
                />
                <div
                    v-if="!currentMonthSelected"
                    class="mx-2 my-auto h-6 w-px bg-main opacity-50"
                />
                <Button
                    as="router-link"
                    :to="`/analysis/${monthAfter.year}/${String(monthAfter.month + 1).padStart(2, '0')}`"
                    :label="shortYearMonthFormat.format(new Date(monthAfter.year, monthAfter.month))"
                    icon="pi pi-chevron-right"
                    icon-pos="right"
                    text
                />
            </div>
        </header>
        <div v-if="report" class="flex flex-wrap justify-around gap-4">
            <Card class="grow">
                <MonthlyExpensesStats :year="year" :month="month" :report="report" />
            </Card>
            <Card class="min-h-120 grow">
                <MonthlyExpensesChart :year="year" :report="report" />
            </Card>
        </div>
    </main>
</template>
