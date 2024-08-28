<script setup lang="ts" generic="T extends OneoffTransaction | MonthlyTransaction">
import { computed, ref, shallowRef, watch } from 'vue';

import { MonthlyTransaction, OneoffTransaction } from '@backend-types/TransactionTypes';
import { breakpointsTailwind } from '@vueuse/core';

import LoadingSpinner from '@/components/LoadingSpinner.vue';
import DeleteAction from '@/components/lists/DeleteAction.vue';
import EditAction from '@/components/lists/EditAction.vue';
import QuickActionModal from '@/components/lists/QuickActionModal.vue';
import TransactionListHeader from '@/components/lists/TransactionListHeader.vue';
import TransactionListRow from '@/components/lists/TransactionListRow.vue';
import type { Breakpoint, ColumnSettings, NotEmptyBreakpoint } from '@/components/lists/listConfig';
import { breakpoints } from '@/components/lists/listConfig';

// Generate a unique CSS identifier for the table, because we may need to apply CSS rules specific to this component instance, without relying on scoped css
const id = 'id' + Math.floor(Math.random() * 1_000_000).toString();

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

const quickActionModal = ref<InstanceType<typeof QuickActionModal>>();
const enabledAction = shallowRef<typeof EditAction | typeof DeleteAction>();
const dialogTransaction = ref<OneoffTransaction | MonthlyTransaction>();

function edit(transaction: OneoffTransaction | MonthlyTransaction) {
    enabledAction.value = EditAction;
    dialogTransaction.value = transaction;
    quickActionModal.value!.open();
}

function del(transaction: OneoffTransaction | MonthlyTransaction) {
    enabledAction.value = DeleteAction;
    dialogTransaction.value = transaction;
    quickActionModal.value!.open();
}

const tailwindColumnRules = ref<string[]>([]);

type ConditionalColumnList<T extends OneoffTransaction | MonthlyTransaction> = {
    index: number;
    column: Omit<ColumnSettings<T>, 'breakpoint'> & { breakpoint: NotEmptyBreakpoint };
}[];
const conditionalColumns = computed<ConditionalColumnList<T>>(() => {
    return props.columnSettings
        .map((column, index) => {
            return { column, index };
        })
        .filter((column) => column.column.breakpoint !== '') as ConditionalColumnList<T>;
});

watch(
    () => props.columnSettings,
    () => {
        // Always at least one column for actions (except for smallest screen size) plus N columns for all non-conditional columns
        const alwaysVisibleColumnCount =
            props.columnSettings.length - conditionalColumns.value.length;
        const columnsByBreakpoint = Object.fromEntries(
            breakpoints.map((breakpoint) => [
                breakpoint,
                alwaysVisibleColumnCount + (breakpoint ? 1 : 0)
            ])
        ) as Record<Breakpoint, number>;

        for (const { column, index } of conditionalColumns.value) {
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
    <!-- `style` tags are unfortunately not allowed in components, so we need to do a hack here -->
    <component :is="'style'" v-for="{ column, index } in conditionalColumns">
        @media screen and (max-width:
        {{ breakpointsTailwind[column.breakpoint] - 1 }}px) { table#{{ id }} > :is(tbody, thead) >
        tr > :is(td, th):nth-child({{ index + 1 }}) { display: none !important; } }
    </component>
    <table :id="id" class="grid-cols grid w-full" :class="tailwindColumnRules">
        <thead class="contents">
            <TransactionListHeader :column-settings="props.columnSettings" />
        </thead>
        <tbody
            v-if="props.transactions && props.transactions.length > 0 && !props.loading"
            class="contents"
        >
            <TransactionListRow
                v-for="transaction in transactions"
                :key="transaction.id"
                :transaction="transaction"
                :column-settings="props.columnSettings"
                @edit="edit(transaction)"
                @delete="del(transaction)"
            />
        </tbody>
        <tbody v-else class="col-span-full justify-self-center p-2">
            <span v-if="props.loading">
                <LoadingSpinner />
            </span>
            <span v-else>Keine Einträge</span>
        </tbody>
    </table>
    <QuickActionModal
        ref="quickActionModal"
        :title="enabledAction === EditAction ? 'Transaktion bearbeiten' : 'Transaktion löschen'"
    >
        <component
            :is="enabledAction"
            :column-settings="$props.columnSettings"
            :transaction="dialogTransaction"
            @done="quickActionModal!.close()"
        />
    </QuickActionModal>
</template>
