<script setup lang="ts" generic="T extends OneoffTransaction | MonthlyTransaction">
import { ref } from 'vue';

import { MonthlyTransaction, OneoffTransaction } from '@backend-types/TransactionTypes';

import { NotificationEvent, NotificationStyle, eventEmitter } from '@/components/Notification.vue';
import LoadingButton from '@/components/input/LoadingButton.vue';
import { ColumnSettings } from '@/components/lists/listConfig';
import { isOneoffTransaction, useTransactionStore } from '@/stores/TransactionStore';

const props = defineProps<{
    transaction: T;
    columnSettings: ColumnSettings<T>[];
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
        Folgende Transaktion wirklich löschen?
        <table>
            <tr
                class="odd:bg-secondary-bg"
                v-for="(column, index) in props.columnSettings"
                :key="index"
            >
                <div v-if="column.text_function(props.transaction, 'long')" class="contents">
                    <td class="p-1 text-center font-semibold">
                        {{ column.title }}
                    </td>
                    <td
                        class="p-1 text-center"
                        :class="
                            column.style_function ? column.style_function(props.transaction) : ''
                        "
                    >
                        {{ column.text_function(props.transaction, 'long') }}
                    </td>
                </div>
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
