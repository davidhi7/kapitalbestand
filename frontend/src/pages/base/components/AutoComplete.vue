<script setup lang="ts">
import { defineModel, defineProps } from 'vue';

import Input from './Input.vue';

const model = defineModel();
const props = defineProps<{
    suggestions: string[];
}>();
</script>

<template>
    <!-- TODO outlines -->
    <div class="relative group focus-within:bg-input-bg dark:focus-within:bg-input-bg-dark">
        <Input class="outline-none" type="text" :standalone="false" v-model="model" />
        <div class="absolute w-full z-10 hidden group-focus-within:flex flex-col items-start group-focus-within:bg-input-bg group-focus-within:dark:bg-input-bg-dark">
            <button class="px-2 m-1" v-for="suggestion in [1, 2, 3, 4, 5]" @click.prevent="model=suggestion">{{ suggestion }}</button>
        </div>
    </div>
</template>
