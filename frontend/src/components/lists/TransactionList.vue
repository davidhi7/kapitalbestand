<script setup>
import { computed, provide } from 'vue';

import TransactionListHeader from '@/components/lists/TransactionListHeader.vue';
import TransactionListRow from '@/components/lists/TransactionListRow.vue';
import { useTransactionStore } from '@/stores/TransactionStore';

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
    <table
        class="grid w-full shadow-xl dark:shadow-2xl"
        :class="{
            'grid-cols-3 sm:grid-cols-4': frequency === 'oneoff',
            'grid-cols-4 sm:grid-cols-5': frequency === 'monthly'
        }"
    >
        <TransactionListHeader />
        <TransactionListRow
            v-for="t in transactions"
            v-if="transactions && transactions.length > 0"
            :key="t.id"
            :transaction="t"
        />
        <td v-else class="col-span-full justify-self-center p-2">Keine Einträge</td>
    </table>
</template>
