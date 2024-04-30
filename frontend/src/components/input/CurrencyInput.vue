<script setup lang="ts">
import { ref, watch } from 'vue';

import { formatCurrency } from '@/common';
import TextInput from '@/components/input/TextInput.vue';

const rawInput = ref('');
const model = defineModel<number>();

function focus() {
    rawInput.value = rawInput.value.replace(/[\s€]+/, '');
}

function unfocus() {
    // Take input value, drop all characters that are not digits or periods or commas
    let input = rawInput.value.replaceAll(/[^\d.,]/g, '');
    if (input.replaceAll(/\D/g, '') === '') {
        // If no digits are present in the regex, set model value to undefined
        rawInput.value = '';
        model.value = undefined;
        return;
    }
    if (input.match(/^[\d.]*,(\d+)?$/)) {
        // assume the use of a comma as decimal separator instead of a point
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
    <TextInput v-model="rawInput" type="text" @focus="focus" @focusout="unfocus" />
</template>
