<script setup lang="ts">
import { ref, watch } from 'vue';

import { dateToIsoDate } from '@/common';
import TextInput from '@/components/input/TextInput.vue';

defineOptions({
    inheritAttrs: false
});

const rawInput = ref('');
const model = defineModel<string>();

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
    const [year, month, day] = value.split('-');
    model.value = `${year}-${month.padStart(2, '0')}`;
    if (!browserSupport && Number(day) !== 1) {
        rawInput.value = dateToIsoDate(new Date(model.value));
    }
}

watch(
    model,
    (value) => {
        if (!value) {
            rawInput.value = '';
            return;
        }

        if (browserSupport) {
            rawInput.value = value;
        } else {
            rawInput.value = `${value}-01`;
        }
    },
    { immediate: true }
);
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
