<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

import { format_year_month } from '@/common';

import MonthlyExpensesChart from './MonthlyExpensesChart.vue';

const route = useRoute();

const currentDate = new Date();
const year = ref<number>(currentDate.getFullYear());
const month = ref<number>(currentDate.getMonth());

watch(
    () => route.params,
    (newParams) => {
        year.value = route.params.year ? Number(route.params.year) : currentDate.getFullYear();
        month.value = route.params.month ? Number(route.params.month) - 1 : currentDate.getMonth();
    },
    {
        deep: true,
        immediate: true
    }
);

function incrementMonth(value: number = 1): { year: number; month: number } {
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

const monthBefore = computed(() => incrementMonth(-1));
const monthAfter = computed(() => incrementMonth());
const currentMonthSelected = computed(() => {
    return year.value === currentDate.getFullYear() && month.value === currentDate.getMonth();
});

defineExpose({
    useFullWidth: true
});
</script>

<template>
    <div class="flex gap-2 justify-between">
        <RouterLink
            :to="`/analysis/${monthBefore.year}/${String(monthBefore.month + 1).padStart(2, '0')}`"
            class="flex items-center gap-1"
        >
            <span class="material-symbols-outlined relative -bottom-0.5">navigate_before</span>
            <span>{{
                format_year_month({ date: new Date(monthBefore.year, monthBefore.month, 1), style: 'short' })
            }}</span>
        </RouterLink>

        <h1 class="flex-1">{{ format_year_month({ date: new Date(year, month, 1), style: 'long' }) }}</h1>

        <div class="flex">
            <RouterLink v-if="!currentMonthSelected" to="/analysis" class="flex items-center gap-1">
                <span>heute</span>
            </RouterLink>
            <div
                v-if="!currentMonthSelected"
                class="mx-2 my-auto h-6 w-[1px] bg-main dark:bg-main-dark opacity-50"
            ></div>
            <RouterLink
                :to="`/analysis/${monthAfter.year}/${String(monthAfter.month + 1).padStart(2, '0')}`"
                class="flex items-center gap-1 text-right"
            >
                <span>{{
                    format_year_month({ date: new Date(monthAfter.year, monthAfter.month, 1), style: 'short' })
                }}</span>
                <span class="material-symbols-outlined relative -bottom-0.5">navigate_next</span>
            </RouterLink>
        </div>
    </div>
    <Suspense>
        <MonthlyExpensesChart :year="year"></MonthlyExpensesChart>
    </Suspense>
</template>
