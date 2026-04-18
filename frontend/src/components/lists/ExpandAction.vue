<script setup lang="ts">
import { computed } from 'vue';

import { shortDateTimeFormat } from '@/common';
import { OneoffTransaction, RecurringTransaction } from '@/stores/TransactionStore';
import { isOneoffTransaction } from '@/stores/TransactionStore';

const props = defineProps<{
    transaction: OneoffTransaction | RecurringTransaction;
}>();

const emit = defineEmits<{
    done: [];
}>();

const keyValuePairs = computed<Record<string, string>>(() => {
    const { isExpense, category, shop, createdAt, updatedAt, id } = props.transaction;
    const isOneoff = isOneoffTransaction(props.transaction);
    let type;
    if (!isOneoff) {
        const recurring = props.transaction as RecurringTransaction;
        const freqLabel = recurring.recurrence.frequency === 'yearly' ? 'jährlich' : 'monatlich';
        if (isExpense) {
            type = `${freqLabel}e Ausgabe`;
        } else {
            type = `${freqLabel}es Einkommen`;
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
        Kategorie: category,
        aktualisiert: shortDateTimeFormat.format(new Date(updatedAt)),
        Händler: shop ? shop : '-',
        Identifikation: id.toString(),
        Typ: type
    };
});
</script>

<template>
    <section v-if="transaction.description">
        {{ transaction.description }}
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
