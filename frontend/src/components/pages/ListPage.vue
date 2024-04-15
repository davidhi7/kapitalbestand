<script setup lang="ts">
import { ref } from 'vue';

import { MonthlyTransaction, OneoffTransaction } from '@backend-types/TransactionTypes';
import { useAsyncState } from '@vueuse/core';

import TransactionFilterForm from '@/components/lists/TransactionFilterForm.vue';
import TransactionList from '@/components/lists/TransactionList.vue';
import {
    monthlyTransactionColumnSettings,
    oneoffTransactionColumnSettings
} from '@/components/lists/listConfig';
import { TransactionFilterRules, useTransactionStore } from '@/stores/TransactionStore';

const TransactionStore = useTransactionStore();

let {
    state: transactionData,
    execute,
    isLoading
} = useAsyncState<(OneoffTransaction | MonthlyTransaction)[]>(
    TransactionStore.fetch,
    TransactionStore.transactions,
    { resetOnExecute: true }
);

function applyRules(filterRules: TransactionFilterRules) {
    TransactionStore.transactionFilterRules = filterRules;
    execute();
}
</script>

<template>
    <div class="layout">
        <header class="flex flex-row items-center justify-between md:col-start-2">
            <h1>Liste</h1>
            <button class="btn flex items-center" @click="TransactionStore.fetch">
                <span class="material-symbols-outlined text-3xl">refresh</span>
            </button>
        </header>

        <aside class="row-start-2">
            <TransactionFilterForm
                :default-filter-rules="Object.assign({}, TransactionStore.transactionFilterRules)"
                @submit="applyRules"
                @reset="applyRules"
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
        @apply overflow-hidden rounded-lg shadow-xl dark:shadow-2xl;
    }
}
</style>
