<script setup lang="ts">
import { breakpointsTailwind, useAsyncState, useBreakpoints } from '@vueuse/core';

import { NotificationEvent, NotificationStyle, eventEmitter } from '@/components/Notification.vue';
import TransactionFilterForm from '@/components/lists/TransactionFilterForm.vue';
import TransactionList from '@/components/lists/TransactionList.vue';
import {
    monthlyTransactionColumnSettings,
    oneoffTransactionColumnSettings
} from '@/components/lists/listConfig';
import { MonthlyTransaction, OneoffTransaction } from '@/stores/TransactionStore';
import {
    OrderKey,
    OrderSettings,
    Ordering,
    TransactionFilterRules,
    useTransactionStore
} from '@/stores/TransactionStore';

const breakpoints = useBreakpoints(breakpointsTailwind);
const TransactionStore = useTransactionStore();

const orderOptions: { text: string; value: OrderSettings }[] = [
    {
        text: 'Älteste zuerst',
        value: { orderKey: OrderKey.Time, ordering: Ordering.Asc }
    },
    {
        text: 'Neueste zuerst',
        value: { orderKey: OrderKey.Time, ordering: Ordering.Desc }
    },
    {
        text: 'Betrag, aufsteigend',
        value: { orderKey: OrderKey.Amount, ordering: Ordering.Asc }
    },
    {
        text: 'Betrag, absteigend',
        value: { orderKey: OrderKey.Amount, ordering: Ordering.Desc }
    },
    {
        text: 'Kategorie, aufsteigend',
        value: { orderKey: OrderKey.Category, ordering: Ordering.Asc }
    },
    {
        text: 'Kategorie, absteigend',
        value: { orderKey: OrderKey.Category, ordering: Ordering.Desc }
    },
    {
        text: 'Händler, aufsteigend',
        value: { orderKey: OrderKey.Shop, ordering: Ordering.Asc }
    },
    {
        text: 'Händler, absteigend',
        value: { orderKey: OrderKey.Shop, ordering: Ordering.Desc }
    }
];

let {
    state: transactionData,
    execute: fetchTransactions,
    isLoading
} = useAsyncState<(OneoffTransaction | MonthlyTransaction)[]>(
    async () => {
        try {
            await TransactionStore.fetch();
        } catch (err) {
            eventEmitter.dispatchEvent(
                new NotificationEvent(
                    NotificationStyle.ERROR,
                    'Fehler beim Laden der Transaktionen'
                )
            );
        }
        return TransactionStore.transactions;
    },
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
                v-model="TransactionStore.transactionFilterRules.order"
                class="rounded-md border-[1px] border-input-bg bg-main-bg p-2 transition-colors hover:bg-input-bg"
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
                :allow-minimizing="breakpoints.smaller('md').value"
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
        @apply overflow-hidden rounded-lg border-[1px] border-tertiary-bg shadow-xl md:self-start dark:shadow-2xl;
    }
}
</style>
