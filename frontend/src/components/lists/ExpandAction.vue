<script setup lang="ts">
import { computed } from 'vue';

import { MonthlyTransaction, OneoffTransaction } from '@backend-types/TransactionTypes';

import { shortDateTimeFormat } from '@/common';
import { isOneoffTransaction } from '@/stores/TransactionStore';

const props = defineProps<{
    transaction: OneoffTransaction | MonthlyTransaction;
}>();

const emit = defineEmits<{
    done: [];
}>();

const keyValuePairs = computed<Record<string, string>>(() => {
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

    return {
        erstellt: shortDateTimeFormat.format(new Date(createdAt)),
        Kategorie: Category.name,
        aktualisiert: shortDateTimeFormat.format(new Date(updatedAt)),
        Händler: Shop ? Shop.name : '-',
        Identifikation: id.toString(),
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
