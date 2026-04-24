<script setup lang="ts" generic="T extends OneoffTransaction | RecurringTransaction">
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import { ref, shallowRef } from 'vue';

import DeleteAction from '@/components/lists/DeleteAction.vue';
import EditAction from '@/components/lists/EditAction.vue';
import ExpandAction from '@/components/lists/ExpandAction.vue';
import type { ColumnSettings } from '@/components/lists/listConfig';
import { RecurringTransaction, OneoffTransaction } from '@/stores/TransactionStore';

const props = withDefaults(
    defineProps<{
        transactions: T[];
        columnSettings: ColumnSettings<T>[];
        loading?: boolean;
    }>(),
    {
        loading: false
    }
);

const expandedRows = ref([]);
const dialogVisible = ref(false);
const dialogTitle = ref('');
const enabledAction = shallowRef<typeof EditAction | typeof DeleteAction>();
const dialogTransaction = ref<OneoffTransaction | RecurringTransaction>();

function edit(transaction: OneoffTransaction | RecurringTransaction) {
    enabledAction.value = EditAction;
    dialogTransaction.value = transaction;
    dialogTitle.value = 'Transaktion bearbeiten';
    dialogVisible.value = true;
}

function del(transaction: OneoffTransaction | RecurringTransaction) {
    enabledAction.value = DeleteAction;
    dialogTransaction.value = transaction;
    dialogTitle.value = 'Transaktion löschen';
    dialogVisible.value = true;
}

function closeDialog() {
    dialogVisible.value = false;
}

function breakpointClass(breakpoint: string): string {
    if (!breakpoint) return '';
    return `hidden ${breakpoint}:table-cell`;
}
</script>

<template>
    <DataTable
        v-model:expanded-rows="expandedRows"
        :value="transactions"
        data-key="id"
        :loading="loading"
        striped-rows
    >
        <template #empty>Keine Einträge</template>

        <Column expander style="width: 3rem" />

        <Column
            v-for="(col, i) in columnSettings"
            :key="i"
            :header="col.title"
            :header-class="breakpointClass(col.breakpoint)"
            :body-class="breakpointClass(col.breakpoint)"
        >
            <template #body="{ data }">
                <span :class="col.style_function?.(data)">
                    {{ col.text_function(data, 'short') }}
                </span>
            </template>
        </Column>

        <Column header="Aktionen">
            <template #body="{ data }">
                <div class="flex justify-center gap-1">
                    <Button
                        icon="pi pi-pencil"
                        text
                        rounded
                        size="small"
                        @click="edit(data)"
                    />
                    <Button
                        icon="pi pi-trash"
                        text
                        rounded
                        severity="danger"
                        size="small"
                        @click="del(data)"
                    />
                </div>
            </template>
        </Column>

        <template #expansion="{ data }">
            <ExpandAction :transaction="data" />
        </template>
    </DataTable>

    <Dialog v-model:visible="dialogVisible" :header="dialogTitle" modal>
        <component
            :is="enabledAction"
            :column-settings="$props.columnSettings"
            :transaction="dialogTransaction"
            @done="closeDialog"
        />
    </Dialog>
</template>
