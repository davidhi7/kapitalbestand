<script setup lang="ts" generic="T extends OneoffTransaction | MonthlyTransaction">
import { MonthlyTransaction, OneoffTransaction } from '@backend-types/TransactionTypes';

import { ColumnSettings } from '@/components/lists/listConfig';

const props = defineProps<{
    columnSettings: ColumnSettings<T>[];
}>();
</script>

<template>
    <tr class="contents">
        <th v-for="(column, index) in props.columnSettings" :key="index">
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
