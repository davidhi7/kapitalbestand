<script setup lang="ts">
import { ref } from 'vue';

import TextInput from '@/components/input/TextInput.vue';

export interface MonthType {
    year: number;
    month: number;
}

defineOptions({
    inheritAttrs: false
});

const rawInput = ref('');
const model = defineModel<MonthType>();

// Firefox desktop does not support input[type='month'] tags on desktop and falls back to a simple text input.
const testElement = document.createElement('input');
testElement.setAttribute('type', 'month');
const browserSupport = testElement.type === 'month';

function handleInput() {
    const value = rawInput.value;
    if (!value) {
        model.value = undefined;
        return;
    }
    const [year, month, day] = value.split('-').map(Number);
    model.value = { year, month };
    if (!browserSupport && day !== 1) {
        rawInput.value = `${year}-${month.toString().padStart(2, '0')}-01`;
    }
}
</script>

<template>
    <TextInput
        v-if="browserSupport"
        v-model="rawInput"
        type="month"
        v-bind="$attrs"
        @focusout="handleInput"
    />
    <TextInput v-else v-model="rawInput" type="date" v-bind="$attrs" @focusout="handleInput" />
</template>
