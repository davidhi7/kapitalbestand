<script setup lang="ts">
import { inject, ref } from 'vue';

import { MonthlyTransaction, OneoffTransaction } from '@backend-types/TransactionTypes';

import LoadingSpinner from '@/components/LoadingSpinner.vue';
import { isOneoffTransaction, useTransactionStore } from '@/stores/TransactionStore';

const props = defineProps<{
    transaction: OneoffTransaction | MonthlyTransaction;
}>();

const emit = defineEmits<{
    done: [];
}>();

const TransactionStore = useTransactionStore();
const requestPending = ref(false);

async function del() {
    requestPending.value = true;
    await TransactionStore.delete(
        isOneoffTransaction(props.transaction) ? 'oneoff' : 'monthly',
        props.transaction.id
    );
    requestPending.value = false;
    emit('done');
}
</script>

<template>
    Transaktion wirklich löschen?
    <div class="flex justify-center gap-2">
        <button class="btn btn-red" :disabled="requestPending" @click="del">
            <span v-show="!requestPending">Löschen</span>
            <LoadingSpinner v-show="requestPending"></LoadingSpinner>
        </button>
        <button class="btn" :disabled="requestPending" @click="emit('done')">Abbrechen</button>
    </div>
</template>

<style scoped></style>
