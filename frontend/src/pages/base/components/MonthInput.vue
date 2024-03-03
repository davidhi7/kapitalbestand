<script setup lang="ts">
import TextInput from './TextInput.vue';

export interface MonthType {
    year: number;
    month: number;
}

defineOptions({
    inheritAttrs: false
});

const model = defineModel<MonthType>();

// Firefox desktop does not support input[type='month'] tags on desktop and falls back to a simple text input.
const testElement = document.createElement('input');
testElement.setAttribute('type', 'month');
const browserSupport = testElement.type === 'month';

function handleInput(evt: InputEvent) {
    const value = (evt.target! as HTMLInputElement).value;
    if (!value) {
        model.value = undefined;
        return;
    }
    const [year, month] = value.split('-');
    model.value = { year: Number(year), month: Number(month) };
}
</script>

<template>
    <TextInput
        v-if="browserSupport"
        type="month"
        :value="model ? `${model.year}-${model.month.toString().padStart(2, '0')}` : ''"
        @input="handleInput"
        v-bind="$attrs"
    />
    <TextInput
        v-if="!browserSupport"
        :value="model ? `${model.year}-${model.month.toString().padStart(2, '0')}-01` : ''"
        type="date"
        @input="handleInput"
        v-bind="$attrs"
    />
</template>
