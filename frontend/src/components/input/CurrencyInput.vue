<script setup lang="ts">
import InputText from 'primevue/inputtext';
import { ref, watch } from 'vue';

import { formatCurrency } from '@/common';

const rawInput = ref('');
const model = defineModel<number>();

function focus() {
    rawInput.value = rawInput.value.replace(/[\s€]+/, '');
}

function unfocus() {
    let input = rawInput.value.replaceAll(/[^\d.,]/g, '');
    if (input.replaceAll(/\D/g, '') === '') {
        rawInput.value = '';
        model.value = undefined;
        return;
    }
    if (input.match(/^[\d.]*,(\d+)?$/)) {
        input = input.replaceAll('.', '').replace(',', '.');
    } else {
        input = input.replaceAll(',', '');
    }
    const inputNumber = Number(input);
    const sanitizedNumber = Math.max(1, Math.round(100 * inputNumber));
    model.value = sanitizedNumber;
}

watch(
    model,
    (value) => {
        if (value != null) {
            rawInput.value = formatCurrency(value);
        } else {
            rawInput.value = '';
        }
    },
    { immediate: true }
);
</script>

<template>
    <InputText v-model="rawInput" type="text" fluid @focus="focus" @blur="unfocus" />
</template>
