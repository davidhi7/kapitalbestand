<script setup lang="ts">
import Button from 'primevue/button';
import Panel from 'primevue/panel';
import Select from 'primevue/select';
import { useToast } from 'primevue/usetoast';
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { LocationQuery, LocationQueryRaw } from 'vue-router';

import {
    breakpointsTailwind,
    useAsyncState,
    useBreakpoints
} from '@vueuse/core';

import { dateToIsoDate, parseIsoDate } from '@/common';
import TransactionFilterForm from '@/components/lists/TransactionFilterForm.vue';
import TransactionList from '@/components/lists/TransactionList.vue';
import {
    oneoffTransactionColumnSettings,
    recurringTransactionColumnSettings
} from '@/components/lists/listConfig';
import {
    CategoryShopOption,
    CategoryWithoutMeta,
    useCategoryShopStore
} from '@/stores/CategoryShopStore';
import {
    OneoffTransaction,
    RecurringTransaction
} from '@/stores/TransactionStore';
import { useTransactionStore } from '@/stores/TransactionStore';

enum Ordering {
    Asc = 'Asc',
    Desc = 'Desc'
}

enum OrderKey {
    Time = 'Time',
    Amount = 'Amount',
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
    category?: CategoryWithoutMeta;
    shop?: CategoryShopOption;
};

const TransactionStore = useTransactionStore();
const CategoryShopStore = useCategoryShopStore();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const breakpoints = useBreakpoints(breakpointsTailwind);
const allowMinimizing = breakpoints.smaller('lg');
const isExpanded = ref(true);

function findCategoryById(id: number): CategoryWithoutMeta | undefined {
    return Object.values(CategoryShopStore.categories).find((c) => c.id === id);
}

function findShopById(id: number): CategoryShopOption | undefined {
    return Object.values(CategoryShopStore.shops).find((s) => s.id === id);
}

/**
 * Serialize the active filter/order state into SPA URL query params. The names
 * mirror the backend query params built in `TransactionStore.fetch`; the extra
 * `recurrence` param records which endpoints are queried.
 */
function rulesToQuery(
    rules: TransactionFilterRules,
    order: TransactionOrderRules
): LocationQueryRaw {
    const query: LocationQueryRaw = {
        ordering: order.ordering,
        orderKey: order.orderKey
    };
    if (rules.type === 'expense') query.isExpense = 'true';
    else if (rules.type === 'income') query.isExpense = 'false';
    if (rules.recurrence !== 'all') query.recurrence = rules.recurrence;
    if (rules.dateFrom) query.dateFrom = dateToIsoDate(rules.dateFrom);
    if (rules.dateTo) query.dateTo = dateToIsoDate(rules.dateTo);
    if (rules.amountFrom != null) query.amountFrom = String(rules.amountFrom);
    if (rules.amountTo != null) query.amountTo = String(rules.amountTo);
    if (rules.category) query.categoryId = String(rules.category.id);
    if (rules.shop) {
        if (rules.shop.id === null) query.shopFilter = 'null';
        else query.shopId = String(rules.shop.id);
    }
    return query;
}

function firstValue(
    value: LocationQuery[string] | undefined
): string | undefined {
    const v = Array.isArray(value) ? value[0] : value;
    return v == null || v === '' ? undefined : v;
}

function parseOrderKey(value?: string): OrderKey {
    switch (value) {
        case OrderKey.Amount:
            return OrderKey.Amount;
        case OrderKey.Category:
            return OrderKey.Category;
        case OrderKey.Shop:
            return OrderKey.Shop;
        default:
            return OrderKey.Time;
    }
}

/**
 * Inverse of `rulesToQuery`. Category/shop names are resolved from the store
 * when it is already loaded; the id alone suffices for the API call and the
 * name is backfilled once the store loads (see watcher below).
 */
function queryToRules(query: LocationQuery): {
    rules: TransactionFilterRules;
    order: TransactionOrderRules;
} {
    const order: TransactionOrderRules = {
        ordering:
            firstValue(query.ordering) === Ordering.Desc
                ? Ordering.Desc
                : Ordering.Asc,
        orderKey: parseOrderKey(firstValue(query.orderKey))
    };

    let type: TransactionFilterRules['type'] = 'all';
    const isExpense = firstValue(query.isExpense);
    if (isExpense === 'true') type = 'expense';
    else if (isExpense === 'false') type = 'income';

    let recurrence: TransactionFilterRules['recurrence'] = 'all';
    const rec = firstValue(query.recurrence);
    if (rec === 'oneoff' || rec === 'recurring') recurrence = rec;

    const rules: TransactionFilterRules = { type, recurrence };

    const dateFrom = firstValue(query.dateFrom);
    if (dateFrom) rules.dateFrom = parseIsoDate(dateFrom);
    const dateTo = firstValue(query.dateTo);
    if (dateTo) rules.dateTo = parseIsoDate(dateTo);

    const amountFrom = firstValue(query.amountFrom);
    if (amountFrom != null) {
        const n = Number(amountFrom);
        if (!Number.isNaN(n)) rules.amountFrom = n;
    }
    const amountTo = firstValue(query.amountTo);
    if (amountTo != null) {
        const n = Number(amountTo);
        if (!Number.isNaN(n)) rules.amountTo = n;
    }

    const categoryId = firstValue(query.categoryId);
    if (categoryId != null) {
        const id = Number(categoryId);
        if (!Number.isNaN(id)) {
            rules.category = findCategoryById(id) ?? { id, name: '' };
        }
    }

    const shopFilter = firstValue(query.shopFilter);
    const shopId = firstValue(query.shopId);
    if (shopFilter === 'null') {
        rules.shop = { id: null, name: '(Ohne Händler)' };
    } else if (shopId != null) {
        const id = Number(shopId);
        if (!Number.isNaN(id)) {
            rules.shop = findShopById(id) ?? { id, name: '' };
        }
    }

    return { rules, order };
}

// default filter rules set to all transactions since start of the month
const now = new Date();
const defaultRules = ref<TransactionFilterRules>({
    dateFrom: new Date(now.getFullYear(), now.getMonth(), 1),
    type: 'all',
    recurrence: 'all'
});
const defaultOrder: TransactionOrderRules = {
    ordering: Ordering.Asc,
    orderKey: OrderKey.Time
};

// Initialize from the URL query when present so the list is shareable and
// survives reloads; otherwise fall back to the defaults.
const initialFromUrl = queryToRules(route.query);
const hasUrlQuery = Object.keys(route.query).length > 0;
const activeRules = ref<TransactionFilterRules>(
    hasUrlQuery ? initialFromUrl.rules : { ...defaultRules.value }
);
const activeOrder = ref<TransactionOrderRules>(
    hasUrlQuery ? initialFromUrl.order : { ...defaultOrder }
);

function resetFilters() {
    activeRules.value = { ...defaultRules.value };
}

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
} = useAsyncState<{
    oneoff?: OneoffTransaction[];
    recurring?: RecurringTransaction[];
}>(async () => {
    try {
        return await TransactionStore.fetch(
            activeRules.value,
            activeOrder.value
        );
    } catch (err) {
        console.error(err);
        toast.add({
            severity: 'error',
            summary: 'Fehler beim Laden der Transaktionen',
            life: 3000
        });
    }
    return {};
}, {});

function search() {
    router
        .push({ query: rulesToQuery(activeRules.value, activeOrder.value) })
        .catch(() => {
            // Ignore the redundant-navigation rejection when nothing changed.
        });
}

// React to URL changes — our own pushes from `search` as well as browser
// back/forward — by re-reading the filters from the URL and refetching.
watch(
    () => route.query,
    () => {
        const { rules, order } = queryToRules(route.query);
        activeRules.value = rules;
        activeOrder.value = order;
        fetchTransactions();
    }
);

// Backfill category/shop display names once the store finishes loading, e.g.
// after a cold reload where the URL only carried a categoryId/shopId.
watch(
    () => [
        Object.keys(CategoryShopStore.categories).length,
        Object.keys(CategoryShopStore.shops).length
    ],
    () => {
        const cat = activeRules.value.category;
        if (cat && !cat.name) {
            const found = findCategoryById(cat.id);
            if (found) activeRules.value.category = found;
        }
        const shop = activeRules.value.shop;
        if (shop && shop.id !== null && !shop.name) {
            const found = findShopById(shop.id);
            if (found) activeRules.value.shop = found;
        }
    }
);
</script>

<template>
    <div
        class="flex flex-col gap-y-8 lg:grid lg:grid-cols-[400px_auto] lg:gap-x-6"
    >
        <header class="flex flex-row items-center gap-2 md:col-start-2">
            <h1 class="grow text-left">Liste</h1>
            <span class="pi pi-sort-alt" />
            <Select
                v-model="activeOrder"
                :options="orderOptions"
                option-label="text"
                option-value="value"
                scroll-height="24rem"
                @change="search"
            />
        </header>

        <aside class="row-start-2 lg:self-start">
            <Panel
                :toggleable="allowMinimizing"
                :collapsed="allowMinimizing && !isExpanded"
                @update:collapsed="(v: boolean) => (isExpanded = !v)"
            >
                <template #header>
                    <div class="flex grow items-center gap-2">
                        <div class="flex items-center gap-2 font-semibold">
                            <span class="pi pi-filter" />
                            <span>Filter</span>
                        </div>
                        <div class="ml-auto flex items-center gap-1">
                            <Button
                                label="Suchen"
                                severity="success"
                                text
                                size="small"
                                @click="search"
                            />
                            <Button
                                label="Zurücksetzen"
                                severity="secondary"
                                text
                                size="small"
                                @click="resetFilters"
                            />
                        </div>
                    </div>
                </template>
                <TransactionFilterForm
                    v-model="activeRules"
                    :default-filter-rules="activeRules"
                    @submit="search"
                />
            </Panel>
        </aside>

        <main class="row-start-2 flex flex-col items-stretch gap-6 *:w-full">
            <Panel>
                <template #header>
                    <div class="font-semibold">
                        Wiederkehrende Transaktionen
                    </div>
                </template>
                <TransactionList
                    v-if="transactionData.recurring || isLoading"
                    :column-settings="recurringTransactionColumnSettings"
                    :transactions="transactionData.recurring || []"
                    :loading="isLoading"
                />
            </Panel>
            <Panel>
                <template #header>
                    <div class="font-semibold">Einmalige Transaktionen</div>
                </template>
                <TransactionList
                    v-if="transactionData.oneoff || isLoading"
                    :column-settings="oneoffTransactionColumnSettings"
                    :transactions="transactionData.oneoff || []"
                    :loading="isLoading"
                />
            </Panel>
        </main>
    </div>
</template>
