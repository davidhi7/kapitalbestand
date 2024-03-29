<script setup lang="ts">
import { ref } from 'vue';

import { format_currency } from '@/common';
import TextInput from '@/components/input/TextInput.vue';

const rawInput = ref('');
const model = defineModel<number>({ default: 0 });

function focus() {
    rawInput.value = rawInput.value.replace(/[\s€]+/, '');
}

function unfocus() {
    let input = rawInput.value;
    if (!input.match(/^[^.,\d]*\d*\.\d+[^.,\d]*$/)) {
        // assume the use of a comma as decimal separator instead of a point
        input = input.replace('.', '').replace(',', '.');
    }
    const raw_input = Number(input.replace(/[^0-9.]+/, ''));
    const sanitizedNumber = Math.max(1, Math.round(100 * raw_input));
    model.value = sanitizedNumber;
    rawInput.value = format_currency(sanitizedNumber);
}
</script>

<template>
    <TextInput
        v-model="rawInput"
        type="text"
        placeholder="0,00 €"
        @focus="focus"
        @focusout="unfocus"
    />
</template>
