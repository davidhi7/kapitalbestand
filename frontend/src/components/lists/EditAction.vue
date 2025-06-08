<script setup lang="ts">
import TransactionForm from '@/components/forms/TransactionForm.vue';
import { MonthlyTransaction, OneoffTransaction } from '@/stores/TransactionStore';

const props = defineProps<{
    transaction: OneoffTransaction | MonthlyTransaction;
}>();

const emit = defineEmits<{
    done: [];
}>();
</script>

<template>
    <TransactionForm
        :transaction="props.transaction"
        :show-cancel-button="true"
        @done="emit('done')"
    />
</template>
