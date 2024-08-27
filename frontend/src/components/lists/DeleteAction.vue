<script setup lang="ts">
import { ref } from 'vue';

import { MonthlyTransaction, OneoffTransaction } from '@backend-types/TransactionTypes';

import { formatCurrency } from '@/common';
import { NotificationEvent, NotificationStyle, eventEmitter } from '@/components/Notification.vue';
import LoadingButton from '@/components/input/LoadingButton.vue';
import { dateFormatter, monthSpanFormatter } from '@/components/lists/listConfig';
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
    try {
        await TransactionStore.delete(
            isOneoffTransaction(props.transaction) ? 'oneoff' : 'monthly',
            props.transaction.id
        );
        eventEmitter.dispatchEvent(
            new NotificationEvent(NotificationStyle.SUCCESS, 'Transaktion gelöscht')
        );
    } catch (e) {
        eventEmitter.dispatchEvent(
            new NotificationEvent(NotificationStyle.ERROR, 'Fehler bei Löschung')
        );
    }
    requestPending.value = false;
    emit('done');
}
</script>

<template>
    <div class="flex flex-col gap-4">
        Transaktion mit folgenden Details wirklich löschen?

        <table>
            <tr class="odd:bg-secondary-bg" v-if="isOneoffTransaction(props.transaction)">
                <td class="p-1 text-center font-semibold">Datum</td>
                <td class="p-1 text-center">{{ dateFormatter(props.transaction) }}</td>
            </tr>
            <tr class="odd:bg-secondary-bg" v-else>
                <td class="p-1 text-center font-semibold">Zeitraum</td>
                <td class="p-1 text-center">{{ monthSpanFormatter(props.transaction, 'long') }}</td>
            </tr>
            <tr class="odd:bg-secondary-bg">
                <td class="p-1 text-center font-semibold">Betrag</td>
                <td class="p-1 text-center">
                    {{ formatCurrency(props.transaction.Transaction.amount) }}
                </td>
            </tr>
            <tr class="odd:bg-secondary-bg">
                <td class="p-1 text-center font-semibold">Kategorie</td>
                <td class="p-1 text-center">{{ props.transaction.Transaction.Category.name }}</td>
            </tr>
        </table>

        <div class="flex justify-center gap-2">
            <LoadingButton
                class="btn-red"
                :disabled="requestPending"
                :loading="requestPending"
                @click="del"
                >Löschen</LoadingButton
            >
            <button class="btn" :disabled="requestPending" @click="emit('done')">Abbrechen</button>
        </div>
    </div>
</template>
