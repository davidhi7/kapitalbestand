<script setup lang="ts">
import Button from 'primevue/button';
import Select from 'primevue/select';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';

import {
    breakpointsTailwind,
    useAsyncState,
    useBreakpoints
} from '@vueuse/core';

import TransactionFilterForm from '@/components/lists/TransactionFilterForm.vue';
import TransactionList from '@/components/lists/TransactionList.vue';
import {
    oneoffTransactionColumnSettings,
    recurringTransactionColumnSettings
} from '@/components/lists/listConfig';
import {
    OneoffTransaction,
    RecurringTransaction
} from '@/stores/TransactionStore';
import { useTransactionStore } from '@/stores/TransactionStore';

import VerticalSlidingTransition from '../transitions/VerticalSlidingTransition.vue';

enum Ordering {
    Asc = 'Asc',
    Desc = 'Desc'
}

enum OrderKey {
    Time = 'Time',
    Amount = 'Amont',
    Category = 'Category',
    Shop = 'Shop'
}

export type TransactionOrderRules = {
    ordering: Ordering;
    orderKey: OrderKey;
};

export type TransactionFilterRules = {
    type: 'all' | 'expense' | 'income';
    recurrence: 'all' | 'oneoff' | 'recurring';
    dateFrom?: Date;
    dateTo?: Date;
    amountFrom?: number;
    amountTo?: number;
    category?: string;
    shop?: string;
};

const TransactionStore = useTransactionStore();
const toast = useToast();
const breakpoints = useBreakpoints(breakpointsTailwind);
const allowMinimizing = breakpoints.smaller('lg');
const isExpanded = ref(true);

// default filter rules set to all transactions since start of the month
const now = new Date();
const defaultRules = ref<TransactionFilterRules>({
    dateFrom: new Date(now.getFullYear(), now.getMonth(), 1),
    type: 'all',
    recurrence: 'all'
});
const activeRules = ref<TransactionFilterRules>({ ...defaultRules.value });
const activeOrder = ref<TransactionOrderRules>({
    ordering: Ordering.Asc,
    orderKey: OrderKey.Time
});

const orderOptions: { text: string; value: TransactionOrderRules }[] = [
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
    async (rules: TransactionFilterRules) => {
        console.log(activeRules.value);
        try {
            return await TransactionStore.fetch(rules, activeOrder.value);
        } catch (err) {
            toast.add({
                severity: 'error',
                summary: 'Fehler beim Laden der Transaktionen',
                life: 3000
            });
        }
        return [];
    },
    [],
    { resetOnExecute: true }
);
</script>

<template>
    <div class="layout">
        <header class="flex flex-row items-center gap-2 md:col-start-2">
            <h1 class="flex-grow text-left">Liste</h1>
            <span class="pi pi-sort-alt" />
            <Select
                v-model="activeOrder"
                :options="orderOptions"
                option-label="text"
                option-value="value"
                scroll-height="24rem"
            />
        </header>

        <aside class="row-start-2">
            <header class="grid grid-cols-3 border-b-[1px] border-tertiary-bg">
                <div
                    class="col-start-2 flex items-center justify-center gap-1 p-2 font-semibold"
                >
                    <span class="pi pi-filter" />
                    <span>Filter</span>
                </div>
                <Button
                    v-if="allowMinimizing"
                    :icon="
                        isExpanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'
                    "
                    text
                    rounded
                    severity="secondary"
                    size="small"
                    class="m-1 self-center justify-self-end"
                    @click.prevent="isExpanded = !isExpanded"
                />
            </header>
            <VerticalSlidingTransition
                duration-class="duration-200"
                :render="isExpanded || !allowMinimizing"
            >
                <TransactionFilterForm
                    v-model="activeRules"
                    :default-filter-rules="activeRules"
                    @submit="fetchTransactions(undefined, activeRules)"
                />
            </VerticalSlidingTransition>
        </aside>

        <main class="row-start-2">
            <TransactionList
                v-if="activeRules.recurrence !== 'recurring'"
                :column-settings="recurringTransactionColumnSettings"
                :transactions="transactionData as RecurringTransaction[]"
                :loading="isLoading"
            />
            <TransactionList
                v-if="activeRules.recurrence !== 'oneoff'"
                :column-settings="oneoffTransactionColumnSettings"
                :transactions="transactionData as OneoffTransaction[]"
                :loading="isLoading"
            />
        </main>
    </div>
</template>

<style scoped>
.layout {
    @apply flex flex-col gap-y-8 lg:grid lg:grid-cols-[400px_auto] lg:gap-x-8 2xl:gap-x-12;

    & > :is(aside, main) {
        @apply overflow-hidden rounded-lg border-[1px] border-tertiary-bg shadow-xl lg:self-start dark:shadow-2xl;
    }
}
</style>
