<script setup lang="ts" generic="T extends OneoffTransaction | MonthlyTransaction">
import { ref, watch } from 'vue';

import { MonthlyTransaction, OneoffTransaction } from '@backend-types/TransactionTypes';

import LoadingSpinner from '@/components/LoadingSpinner.vue';
import TransactionListHeader from '@/components/lists/TransactionListHeader.vue';
import TransactionListRow from '@/components/lists/TransactionListRow.vue';
import type { Breakpoint, ColumnSettings } from '@/components/lists/listConfig';
import { breakpoints } from '@/components/lists/listConfig';

const props = withDefaults(
    defineProps<{
        transactions: T[];
        columnSettings: ColumnSettings<T>[];
        loading?: boolean;
    }>(),
    {
        loading: false
    }
);

const tailwindColumnRules = ref<string[]>([]);

watch(
    props,
    () => {
        // Always at least one column for actions except for smallest screen size
        const columnsByBreakpoint = Object.fromEntries(
            breakpoints.map((breakpoint) => [breakpoint, breakpoint ? 1 : 0])
        ) as Record<Breakpoint, number>;

        for (const column of props.columnSettings) {
            const minBreakpoint = breakpoints.indexOf(column.breakpoint);
            for (let i = minBreakpoint; i < breakpoints.length; i++) {
                columnsByBreakpoint[breakpoints[i]]++;
            }
        }

        tailwindColumnRules.value = breakpoints.map(
            (breakpoint) =>
                `${breakpoint ? breakpoint + ':' : ''}grid-cols-${columnsByBreakpoint[breakpoint]}`
        );
    },
    { immediate: true }
);
</script>

<template>
    <table class="grid-cols grid w-full" :class="tailwindColumnRules">
        <TransactionListHeader :column-settings="props.columnSettings" />
        <div
            v-if="props.transactions && props.transactions.length > 0 && !props.loading"
            class="contents"
        >
            <TransactionListRow
                v-for="transaction in transactions"
                :key="transaction.id"
                :transaction="transaction"
                :column-settings="props.columnSettings"
            />
        </div>
        <div v-else class="col-span-full justify-self-center p-2">
            <span v-if="props.loading">
                <LoadingSpinner />
            </span>
            <span v-else> Keine Einträge </span>
        </div>
    </table>
</template>
