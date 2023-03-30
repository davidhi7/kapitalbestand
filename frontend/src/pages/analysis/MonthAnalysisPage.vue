<script setup lang="ts">
import { computed, onBeforeMount, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

import { format_year_month } from '@/common';
import MonthlyExpensesChart from './MonthlyExpensesChart.vue';

const route = useRoute();

const currentDate = new Date();
const year = ref<number>(currentDate.getFullYear());
const month = ref<number>(currentDate.getMonth());

watch(() => route.params, (newParams) => {
    year.value = Number(newParams.year);
    month.value = Number(newParams.month) - 1;
}, {
    deep: true
});

year.value = route.params.year ? Number(route.params.year) : currentDate.getFullYear();
month.value = route.params.month ? Number(route.params.month) - 1 : currentDate.getMonth();

function incrementMonth(value: number = 1): { year: number, month: number } {
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
</script>

<template>
    <div class='flex gap-2 justify-between'>
        <RouterLink :to="`/analysis/${monthBefore.year}/${String(monthBefore.month + 1).padStart(2, '0')}`"
            class='flex items-center gap-1 ln'>
            <span class='material-symbols-outlined'>navigate_before</span>
            <span>{{ format_year_month({ date: new Date(monthBefore.year, monthBefore.month, 1), style: 'short' }) }}</span>
        </RouterLink>

        <h1 class='flex-1'>{{ format_year_month({ date: new Date(year, month, 1), style: 'long' }) }}</h1>

        <RouterLink :to="`/analysis/${monthAfter.year}/${String(monthAfter.month + 1).padStart(2, '0')}`"
            class='flex items-center gap-1 text-right ln'>
            <span
                class='ln'>{{ format_year_month({ date: new Date(monthAfter.year, monthAfter.month, 1), style: 'short' }) }}</span>
            <span class='material-symbols-outlined'>navigate_next</span>
        </RouterLink>
    </div>
    <Suspense>
        <MonthlyExpensesChart :year="year"></MonthlyExpensesChart>
    </Suspense>
</template>
