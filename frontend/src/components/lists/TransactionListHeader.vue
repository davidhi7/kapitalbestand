<script setup lang="ts" generic="T extends OneoffTransaction | MonthlyTransaction">
import { computed } from 'vue';

import { MonthlyTransaction, OneoffTransaction } from '@backend-types/TransactionTypes';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';

import { ColumnSettings } from '@/components/lists/listConfig';

const props = defineProps<{
    columnSettings: ColumnSettings<T>[];
}>();

const breakpoints = useBreakpoints(breakpointsTailwind);

const filteredColumns = computed(() => {
    return props.columnSettings.filter((value) => {
        return value.breakpoint === '' || breakpoints.greaterOrEqual(value.breakpoint).value;
    });
});
</script>

<template>
    <tr class="contents">
        <th v-for="(column, index) in filteredColumns" :key="index">
            {{ column.title }}
        </th>
        <th class="hidden sm:block">Aktionen</th>
    </tr>
</template>

<style scoped>
th {
    @apply border-b-[1px] border-tertiary-bg p-2 text-center font-semibold;
}
</style>
