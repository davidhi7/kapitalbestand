<script setup>
import { inject, ref } from 'vue';

import { useTransactionStore } from '@/stores/TransactionStore';

const props = defineProps({
    transaction: {
        type: Object,
        required: true
    }
});
const frequency = inject('frequency');
const emit = defineEmits(['done']);

const TransactionStore = useTransactionStore();
const requestPending = ref(false);

async function del() {
    requestPending.value = true;
    await TransactionStore.delete(frequency, props.transaction.id);
    requestPending.value = false;
    cancel();
}

function cancel() {
    emit('done');
}
</script>

<template>
    Transaktion wirklich löschen?
    <div class="flex justify-center gap-2">
        <button class="btn btn-red" :disabled="requestPending" @click="del">Löschen</button>
        <button class="btn" :disabled="requestPending" @click="cancel">Abbrechen</button>
    </div>
</template>

<style scoped></style>
