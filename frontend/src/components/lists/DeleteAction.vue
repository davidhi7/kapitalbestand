<script setup lang="ts" generic="T extends OneoffTransaction | RecurringTransaction">
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';

import { ColumnSettings } from '@/components/lists/listConfig';
import { OneoffTransaction, RecurringTransaction } from '@/stores/TransactionStore';
import { isOneoffTransaction, useTransactionStore } from '@/stores/TransactionStore';

const props = defineProps<{
    transaction: T;
    columnSettings: ColumnSettings<T>[];
}>();

const emit = defineEmits<{
    done: [];
}>();

const toast = useToast();
const TransactionStore = useTransactionStore();
const requestPending = ref(false);

async function del() {
    requestPending.value = true;
    try {
        await TransactionStore.delete(
            isOneoffTransaction(props.transaction) ? 'oneoff' : 'recurring',
            props.transaction.id
        );
        toast.add({ severity: 'success', summary: 'Transaktion gelöscht', life: 3000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Fehler bei Löschung', life: 3000 });
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
            <Button
                label="Löschen"
                severity="danger"
                :disabled="requestPending"
                :loading="requestPending"
                @click="del"
            />
            <Button
                label="Abbrechen"
                severity="secondary"
                :disabled="requestPending"
                @click="emit('done')"
            />
        </div>
    </div>
</template>
