<script setup lang="ts">
import { defineModel, defineProps } from 'vue';

const props = defineProps({
    type: String,
    standalone: {
        type: Boolean,
        default: true
    }
});
const model = defineModel();
</script>

<template>
    <input :class="{ 'shadow-sm hover:shadow-md': props.standalone }" :type="props.type" v-model="model" />
</template>

<style scoped lang="less">
input[type='text'],
input[type='password'],
input[type='date'],
input[type='month'] {
    @apply bg-input-bg dark:bg-input-bg-dark;
    @apply border-b-2 border-input-bg-dark dark:border-input-bg;
    padding: 8px;
    margin: 4px;
    // box-shadow: 0 0 4px 2px rgba(0, 0, 0, 0.06);
    // @apply dark:shadow-none;
}

input[type='text']:hover,
input[type='password']:hover,
input[type='date']:hover {
    // box-shadow: 0 0 15px 4px rgba(0, 0, 0, 0.08);
}

input[type='text']:focus-visible,
input[type='password']:focus-visible,
input[type='date']:focus-visible {
    @apply border-b-4;
    /* compensate two pixel wider lower border with one pixel smaller padding and margin */
    padding-bottom: 7px;
    margin-bottom: 3px;
    border-radius: 0;
}
</style>
