<script setup lang="ts">
import { computed } from 'vue';

import { MonthlyTransaction, OneoffTransaction } from '@backend-types/TransactionTypes';

import { isOneoffTransaction } from '@/stores/TransactionStore';

const props = defineProps<{
    transaction: OneoffTransaction | MonthlyTransaction;
}>();

const emit = defineEmits<{
    done: [];
}>();

const keyValuePairs = computed(() => {
    const { createdAt, updatedAt, id, Transaction } = props.transaction;
    const { Category, Shop, isExpense } = Transaction;
    const isOneoff = isOneoffTransaction(props.transaction);
    let type;
    if (!isOneoff) {
        if (isExpense) {
            type = 'monatliche Ausgabe';
        } else {
            type = 'monatliches Einkommen';
        }
    } else {
        if (isExpense) {
            type = 'einmalige Ausgabe';
        } else {
            type = 'einmaliges Einkommen';
        }
    }

    // TODO compare transaction and oneoff/monthlytransaction date
    return {
        erstellt: new Date(createdAt).toLocaleString('de-DE'),
        Kategorie: Category.name,
        aktualisiert: new Date(updatedAt).toLocaleString('de-DE'),
        Händler: Shop ? Shop.name : '-',
        Identifikation: id,
        Typ: type
    };
});
</script>

<template>
    <section v-if="transaction.Transaction.description" class="overflow-hidden text-ellipsis">
        {{ transaction.Transaction.description }}
    </section>
    <section class="grid grid-cols-2">
        <div
            v-for="(value, key, index) in keyValuePairs"
            :key="index"
            class="overflow-hidden text-ellipsis text-left"
        >
            <span class="text-sm font-semibold after:content-[':']">{{ key }}</span>
            <span class="text-sm before:content-['_']">{{ value }}</span>
        </div>
    </section>
</template>
