<script setup>
import { provide, computed } from 'vue';

import { useTransactionStore } from '@/stores/TransactionStore';
import TransactionListHeader from './components/TransactionListHeader.vue'
import TransactionListRow from './components/TransactionListRow.vue';

const props = defineProps({
    frequency: {
        type: String,
        required: true,
        validator(value) {
            return ['oneoff', 'monthly'].includes(value);
        }
    }
});

const TransactionStore = useTransactionStore();
let transactions = computed(() => TransactionStore.ordered[props.frequency]);

provide('frequency', props.frequency);
</script>

<template>
    <table class="grid w-full shadow-xl dark:shadow-2xl"
        :class="{ 'grid-cols-3 sm:grid-cols-4': frequency === 'oneoff', 'grid-cols-4 sm:grid-cols-5': frequency === 'monthly' }">
        <TransactionListHeader />
        <TransactionListRow v-if="transactions && transactions.length > 0" v-for="t in transactions" :key="t.id"
            :transaction="t"></TransactionListRow>
        <td v-else class="col-span-full justify-self-center p-2">
            Keine Einträge
        </td>
    </table>
</template>
