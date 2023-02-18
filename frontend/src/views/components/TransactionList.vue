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
const transactions = computed(() => TransactionsStore.transactions[props.frequency][props.type]);

provide('frequency', props.frequency);
</script>

<template>
    <table class="grid w-full shadow-xl dark:shadow-2xl" :class="{ 'grid-cols-4': frequency === 'oneoff', 'grid-cols-5': frequency === 'monthly' }">
        <thead class="contents">
            <TransactionListHeader></TransactionListHeader>
        </thead>
        <tbody v-if="transactions && transactions.length > 0" class="contents">
            <TransactionListRow v-for="t in transactions" :transaction="t"></TransactionListRow>
        </tbody>
        <tbody v-else class="contents">
            <td class="col-span-full justify-self-center p-2">
                Keine Einträge
            </td>
        </tbody>
    </table>
</template>
