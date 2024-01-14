<script setup lang="ts">
import { defineModel, defineProps, withDefaults } from 'vue';

const model = defineModel();
const props = withDefaults(
    defineProps<{
        suggestions: string[];
        type?: 'date' | 'month' | 'password' | 'text';
        placeholder?: string;
        required?: boolean;
    }>(),
    {
        suggestions: () => [],
        type: 'text',
        placeholder: '',
        required: false
    }
);
</script>

<template>
    <!-- TODO outlines -->
    <div class="group relative focus-within:bg-input-bg rounded-t-lg">
        <input class="outline-none group-focus-within:shadow-none" :type="$props.type" :placeholder="props.placeholder" :required="props.required" v-model="model" />
        <div
            class="absolute rounded-b-lg w-full z-10 hidden group-focus-within:flex flex-col flex-grow items-start group-focus-within:bg-input-bg"
        >
            <button class="px-2 m-1" v-for="suggestion in [1, 2, 3, 4, 5]" @click.prevent="model = suggestion">
                {{ suggestion }}
            </button>
        </div>
    </div>
</template>
