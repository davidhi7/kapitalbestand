<script setup lang="ts">
import { computed, defineModel, withDefaults } from 'vue';

import AutCompleteEntry from './AutoCompleteEntry.vue';

const model = defineModel<string>();
const props = withDefaults(
    defineProps<{
        suggestions: string[];
        type?: 'date' | 'month' | 'text';
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

const computedSuggestions = computed<string[]>(() => {
    // TODO more sophisticated algorithm to search + highlight search matches
    return props.suggestions.filter((value) => value.includes(model.value!));
});

function pick(suggestion: string) {
    model.value = suggestion;
    (document.activeElement! as HTMLElement).blur();
}
</script>

<template>
    <!-- TODO outlines -->
    <div class="group relative focus-within:bg-input-bg rounded-t-lg">
        <input
            class="outline-none group-focus-within:bg-input-bg group-focus-within:shadow-none focus:bg-tertiary-bg"
            :type="$props.type"
            :placeholder="props.placeholder"
            :required="props.required"
            v-model="model"
        />
        <div
            class="absolute rounded-b-lg w-full z-10 hidden group-focus-within:flex flex-col items-stretch group-focus-within:bg-input-bg overflow-hidden shadow-md"
        >
            <!-- TODO make use of slots -->
            <slot></slot>
            <AutCompleteEntry v-for="suggestion of computedSuggestions">
                <button @click.prevent="pick(suggestion)">
                    {{ suggestion }}
                </button>
            </AutCompleteEntry>
        </div>
    </div>
</template>
