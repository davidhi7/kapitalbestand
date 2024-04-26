<script setup lang="ts">
import { MonthlyTransaction, OneoffTransaction } from '@backend-types/TransactionTypes';
import { breakpointsTailwind, useAsyncState, useBreakpoints } from '@vueuse/core';

import TransactionFilterForm from '@/components/lists/TransactionFilterForm.vue';
import TransactionList from '@/components/lists/TransactionList.vue';
import {
    monthlyTransactionColumnSettings,
    oneoffTransactionColumnSettings
} from '@/components/lists/listConfig';
import { TransactionFilterRules, useTransactionStore } from '@/stores/TransactionStore';

const breakpoints = useBreakpoints(breakpointsTailwind);
const TransactionStore = useTransactionStore();

const orderOptions: { text: string; value: TransactionFilterRules['order'] }[] = [
    {
        text: 'Älteste zuerst',
        value: { key: 'time', order: 'ASC' }
    },
    {
        text: 'Neueste zuerst',
        value: { key: 'time', order: 'DESC' }
    },
    {
        text: 'Betrag, aufsteigend',
        value: { key: 'amount', order: 'ASC' }
    },
    {
        text: 'Betrag, absteigend',
        value: { key: 'amount', order: 'DESC' }
    },
    {
        text: 'Kategorie, aufsteigend',
        value: { key: 'Category', order: 'ASC' }
    },
    {
        text: 'Kategorie, absteigend',
        value: { key: 'Category', order: 'DESC' }
    },
    {
        text: 'Händler, aufsteigend',
        value: { key: 'Shop', order: 'ASC' }
    },
    {
        text: 'Händler, absteigend',
        value: { key: 'Shop', order: 'DESC' }
    }
];

let {
    state: transactionData,
    execute: fetchTransactions,
    isLoading
} = useAsyncState<(OneoffTransaction | MonthlyTransaction)[]>(
    TransactionStore.fetch,
    TransactionStore.transactions,
    { resetOnExecute: true }
);

function applyRules(filterRules: TransactionFilterRules) {
    TransactionStore.transactionFilterRules = Object.assign(
        {
            order: TransactionStore.transactionFilterRules.order
        },
        filterRules
    );
    fetchTransactions();
}
</script>

<template>
    <div class="layout">
        <header class="flex flex-row items-center gap-1 md:col-start-2">
            <h1 class="flex-grow text-left">Liste</h1>
            <span class="material-symbols-outlined text-xl">sort</span>
            <select
                class="rounded-md border-[1px] border-input-bg bg-main-bg p-2 transition-colors hover:bg-input-bg"
                v-model="TransactionStore.transactionFilterRules.order"
                @change="fetchTransactions()"
            >
                <option v-for="option in orderOptions" :value="option.value">
                    {{ option.text }}
                </option>
            </select>
        </header>

        <aside class="row-start-2">
            <TransactionFilterForm
                :default-filter-rules="Object.assign({}, TransactionStore.transactionFilterRules)"
                @submit="applyRules"
                @reset="applyRules"
                :allow-minimizing="breakpoints.smaller('md').value"
            />
        </aside>
        <main class="row-start-2">
            <TransactionList
                v-if="TransactionStore.transactionFilterRules.isMonthlyTransaction"
                :column-settings="monthlyTransactionColumnSettings"
                :transactions="transactionData as MonthlyTransaction[]"
                :loading="isLoading"
            />
            <TransactionList
                v-else
                :column-settings="oneoffTransactionColumnSettings"
                :transactions="transactionData as OneoffTransaction[]"
                :loading="isLoading"
            />
        </main>
    </div>
</template>

<style scoped>
.layout {
    @apply flex flex-col gap-y-8 md:grid md:grid-cols-[300px_auto] md:gap-x-8 2xl:grid-cols-[300px_auto_300px] 2xl:gap-x-12;

    & > :is(aside, main) {
        @apply overflow-hidden rounded-lg border-[1px] border-tertiary-bg shadow-xl md:self-start dark:shadow-2xl;
    }
}
</style>
