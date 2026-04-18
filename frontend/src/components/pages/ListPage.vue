<script setup lang="ts">
import Select from 'primevue/select';
import { useToast } from 'primevue/usetoast';
import { computed } from 'vue';
import { breakpointsTailwind, useAsyncState, useBreakpoints } from '@vueuse/core';

import TransactionFilterForm from '@/components/lists/TransactionFilterForm.vue';
import TransactionList from '@/components/lists/TransactionList.vue';
import {
    recurringTransactionColumnSettings,
    oneoffTransactionColumnSettings
} from '@/components/lists/listConfig';
import { OneoffTransaction, RecurringTransaction } from '@/stores/TransactionStore';
import {
    OrderKey,
    OrderSettings,
    Ordering,
    TransactionFilterRules,
    useTransactionStore
} from '@/stores/TransactionStore';

const breakpoints = useBreakpoints(breakpointsTailwind);
const TransactionStore = useTransactionStore();
const toast = useToast();

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
} = useAsyncState<(OneoffTransaction | RecurringTransaction)[]>(
    async () => {
        try {
            await TransactionStore.fetch();
        } catch (err) {
            toast.add({
                severity: 'error',
                summary: 'Fehler beim Laden der Transaktionen',
                life: 3000
            });
        }
        return TransactionStore.transactions;
    },
    TransactionStore.transactions,
    { resetOnExecute: true }
);

const selectedOrderOption = computed({
    get() {
        const current = TransactionStore.transactionFilterRules.order;
        return (
            orderOptions.find(
                (o) =>
                    o.value.orderKey === current.orderKey &&
                    o.value.ordering === current.ordering
            ) ?? orderOptions[0]
        );
    },
    set(option: { text: string; value: OrderSettings }) {
        TransactionStore.transactionFilterRules.order = option.value;
        fetchTransactions();
    }
});

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
        <header class="flex flex-row items-center gap-2 md:col-start-2">
            <h1 class="flex-grow text-left">Liste</h1>
            <span class="pi pi-sort-alt" />
            <Select
                v-model="selectedOrderOption"
                :options="orderOptions"
                optionLabel="text"
            />
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
                v-if="TransactionStore.transactionFilterRules.isRecurringTransaction"
                :column-settings="recurringTransactionColumnSettings"
                :transactions="transactionData as RecurringTransaction[]"
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
