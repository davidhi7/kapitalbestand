<script setup lang="ts" generic="T extends {id: any, name: string}">
// TODO focus stuff when using clear button
import { computed, defineModel, ref, watch, withDefaults } from 'vue';

import { normalizeStrings } from '@/common';

import AutoCompleteEntry from './AutoCompleteEntry.vue';
import TextInput from './TextInput.vue';

interface MatchedSuggestion {
    suggestion: T;
    matchFromIndex: number;
    matchToIndex: number;
}

const model = defineModel<T | undefined>();
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
watch(model, (newValue: T | undefined) => {
    if (newValue == undefined) {
        textInput.value = '';
        return;
    }
    textInput.value = newValue.name;
});

const computedSuggestions = computed<MatchedSuggestion[]>(() => {
    const matchedSuggestions: MatchedSuggestion[] = [];
    const normalizedTextInput = normalizeStrings(textInput.value.toLowerCase().trim());

    for (let suggestion of props.suggestions) {
        let normalizedSuggestionName = normalizeStrings(suggestion.name.toLowerCase());

        if (normalizedSuggestionName.includes(normalizedTextInput)) {
            let matchFromIndex = normalizedSuggestionName.indexOf(normalizedTextInput);
            let matchToIndex = matchFromIndex + normalizedTextInput.length;
            matchedSuggestions.push({
                suggestion: suggestion,
                matchFromIndex,
                matchToIndex
            });
        }
    }
    return matchedSuggestions;
});

const exactMatch = computed<MatchedSuggestion | null>(() => {
    for (let matchedSuggestion of computedSuggestions.value) {
        if (
            matchedSuggestion.matchFromIndex === 0 &&
            matchedSuggestion.matchToIndex === matchedSuggestion.suggestion.name.length
        ) {
            return matchedSuggestion;
        }
    }
    return null;
});

function pick(suggestion: T) {
    model.value = suggestion;
    (document.activeElement! as HTMLElement).blur();
    focused.value = false;
}

const root = ref<HTMLElement>();
const focused = ref(false);

function focusIn() {
    focused.value = true;
}

function focusOut(evt: FocusEvent) {
    if (root.value!.contains(evt.relatedTarget as Node)) {
        return;
    }
    focused.value = false;

    if (!model.value) {
        if (exactMatch.value) {
            pick(exactMatch.value.suggestion);
        } else {
            textInput.value = '';
        }
    } else {
        textInput.value = model.value.name;
    }
}

function clear() {
    model.value = undefined;
    textInput.value = '';
    root.value!.querySelector('input')!.focus();
}
</script>

<template>
    <!-- TODO improve outlines visuals -->
    <!-- TODO option to reset -->
    <!-- Container for input field and suggestion buttons -->
    <div
        class="group relative focus-within:bg-input-bg rounded-t-lg"
        :class="{ 'rounded-b-lg': !textInput && computedSuggestions.length == 0 }"
        @focusin="focusIn()"
        @focusout="focusOut($event)"
        ref="root"
    >
        <div class="flex">
            <TextInput
                class="group-focus-within:bg-input-bg group-focus-within:shadow-none has-[:focus-visible]:relative has-[:focus-visible]:z-20"
                :type="$props.type"
                :placeholder="props.placeholder"
                :required="props.required"
                :show-required-indicator="!focused"
                v-model="textInput"
            />
            <button
                v-if="focused && textInput"
                class="absolute -right-10 top-1/2 -translate-y-1/2 my-auto material-symbols-outlined text-2xl p-1 rounded-md focus-visible:outline-default"
                @click.prevent="clear"
            >
                backspace
            </button>
        </div>
        <div
            class="absolute rounded-b-lg w-full z-10 hidden group-focus-within:block group-focus-within:bg-input-bg shadow-md"
        >
            <AutoCompleteEntry
                v-if="textInput && exactMatch == null"
                @click.prevent="emit('requestCreate', textInput.trim())"
            >
                Erstelle <b>{{ textInput }}</b>
            </AutoCompleteEntry>
            <AutoCompleteEntry
                class="whitespace-"
                v-for="suggestion of computedSuggestions"
                @click.prevent="pick(suggestion.suggestion)"
            >
                <span>{{ suggestion.suggestion.name.substring(0, suggestion.matchFromIndex) }}</span>
                <b>{{ suggestion.suggestion.name.substring(suggestion.matchFromIndex, suggestion.matchToIndex) }}</b>
                <span>{{ suggestion.suggestion.name.substring(suggestion.matchToIndex) }}</span>
            </AutoCompleteEntry>
        </div>
    </div>
</template>
