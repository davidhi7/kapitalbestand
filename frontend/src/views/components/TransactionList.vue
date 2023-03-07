<script setup>
import { provide, computed } from 'vue';

import { useTransactionsStore } from '@/stores/TransactionsStore';
import TransactionListHeader from './transaction-list/TransactionListHeader.vue'
import TransactionListRow from './transaction-list/TransactionListRow.vue';

const props = defineProps({
    type: {
        type: String,
        required: true,
        validator(value) {
            return ['expenses', 'incomes'].includes(value);
        }
    },
    frequency: {
        type: String,
        required: true,
        validator(value) {
            return ['oneoff', 'monthly'].includes(value);
        }
    }
});

const TransactionsStore = useTransactionsStore();
const transactions = computed(() => Object.values(TransactionsStore.transactions[props.frequency][props.type]));

provide('frequency', props.frequency);
</script>

<template>
    <table class="grid w-full shadow-xl dark:shadow-2xl" :class="{ 'grid-cols-3 sm:grid-cols-4': frequency === 'oneoff', 'grid-cols-4 sm:grid-cols-5': frequency === 'monthly' }">
        <TransactionListHeader></TransactionListHeader>
        <TransactionListRow v-if="transactions && transactions.length > 0" v-for="(t, key) of transactions" :v-key="key" :transaction="t"></TransactionListRow>
        <td v-else class="col-span-full justify-self-center p-2">
            Keine Einträge
        </td>
    </table>
</template>
