<script setup>
defineProps(['modelValue', 'id', 'required']);
const emit = defineEmits(['update:modelValue']);

// Firefox does not support input[type='month'] tags on desktop and falls back to a simple text input.
// Detect Firefox desktop clients with the useragent and fall back to date inputs for these clients.
const useragent = navigator.userAgent;
let browserSupport = true;
if (useragent.includes('Firefox')) {
    if (!(useragent.includes('Mobile') || useragent.includes('Tablet'))) {
        browserSupport = false;
    }
}

function sanitizeDateInput(evt) {
    const [year, month] = evt.target.value.split('-');
    const value = `${year}-${month}`;
    emit('update:modelValue', value);
    evt.target.value = `${value}-01`;
}
</script>

<template>
    <input v-if="browserSupport" type="month" :id="id" :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)" :required="!!required">
    <input v-else type="date" :id="id" :value="`${modelValue}-01`" @input="sanitizeDateInput" :required="!!required">
</template>
