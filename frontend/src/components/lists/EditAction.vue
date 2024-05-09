<script setup lang="ts">
import { MonthlyTransaction, OneoffTransaction } from '@backend-types/TransactionTypes';

import TransactionForm from '@/components/forms/TransactionForm.vue';

const props = defineProps<{
    transaction: OneoffTransaction | MonthlyTransaction;
}>();

const emit = defineEmits<{
    done: [];
}>();
</script>

<template>
    <TransactionForm :transaction="transaction" :show-cancel-button="true" @done="emit('done')" />
</template>
