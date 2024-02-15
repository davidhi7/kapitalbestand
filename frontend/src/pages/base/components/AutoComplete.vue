<script setup lang="ts" generic="T extends {id: any, name: string}">
import { computed, defineModel, ref, watch, withDefaults } from 'vue';

import AutoCompleteEntry from './AutoCompleteEntry.vue';
import TextInput from './TextInput.vue';

const model = defineModel<T>();
const props = withDefaults(
    defineProps<{
        suggestions: T[];
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

const emit = defineEmits<{
    (e: 'requestCreate', name: string): void;
}>();

let textInput = ref('');
watch(model, (newValue: T) => {
    textInput.value = newValue.name;
});

const computedSuggestions = computed<T[]>(() => {
    return props.suggestions.filter((suggestion) => suggestion.name.includes(textInput.value));
});
const exactSuggestionExists = computed<boolean>(() => {
    return computedSuggestions.value.filter((suggestion) => suggestion.name === textInput.value).length > 0;
});

function pick(suggestion: T) {
    model.value = suggestion;
    (document.activeElement! as HTMLElement).blur();
}

const root = ref<HTMLElement>();
const focused = ref(false);

function focusIn(evt: FocusEvent) {
    focused.value = true;
}

function focusOut(evt: FocusEvent) {
    if (root.value?.contains(evt.relatedTarget as Node)) {
        return;
    }
    focused.value = false;
    
    if (!model.value) {
        textInput.value = "";
    } else {
        textInput.value = model.value.name;
    }
}
</script>

<template>
    <!-- TODO improve outlines visuals -->
    <!-- TODO option to reset -->
    <!-- Container for input field and suggestion buttons -->
    <div
        class="group relative focus-within:bg-input-bg rounded-t-lg"
        :class="{ 'rounded-b-lg': !textInput && computedSuggestions.length == 0 }"
        @focusin="focusIn($event)"
        @focusout="focusOut($event)"
        ref="root"
    >
        <!-- class="... group-focus-within:w-full" forces full width but breaks layout for required elements -->
        <TextInput
            class="group-focus-within:bg-input-bg group-focus-within:shadow-none"
            :type="$props.type"
            :placeholder="props.placeholder"
            :required="props.required"
            :show-required-indicator="!focused"
            v-model="textInput"
        />
        <div
            class="absolute rounded-b-lg w-full z-10 hidden group-focus-within:block group-focus-within:bg-input-bg overflow-hidden shadow-md"
        >
            <AutoCompleteEntry v-if="textInput && !exactSuggestionExists" @click.prevent="emit('requestCreate', textInput)">
                Erzeuge <b>{{ textInput }}</b>
            </AutoCompleteEntry>
            <AutoCompleteEntry v-for="suggestion of computedSuggestions" @click.prevent="pick(suggestion)">
                {{ suggestion.name }}
            </AutoCompleteEntry>
        </div>
    </div>
</template>
