<script setup lang="ts" generic="T extends { id: any; name: string }">
import { computed, defineModel, ref, watch, withDefaults } from 'vue';

import { normalizeStrings } from '@/common';
import AutoCompleteEntry from '@/components/autocomplete/AutoCompleteEntry.vue';
import TextInput from '@/components/input/TextInput.vue';

interface MatchedSuggestion {
    suggestion: T;
    matchFromIndex: number;
    matchToIndex: number;
}

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
watch(
    model,
    (newValue: T | undefined) => {
        if (newValue == undefined) {
            textInput.value = '';
            return;
        }
        textInput.value = newValue.name;
    },
    { immediate: true }
);

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

function focusOut(evt: FocusEvent | null) {
    if (evt && root.value!.contains(evt.relatedTarget as Node)) {
        return;
    }
    focused.value = false;

    if (!model.value) {
        // If no instance is currently selected, select the instance that
        // completely matches the input, otherwise just reset
        if (exactMatch.value) {
            pick(exactMatch.value.suggestion);
        } else {
            textInput.value = '';
        }
    } else if (textInput.value === '') {
        // If an instance is selected but the input field is empty, deselect the instance
        clear();
    } else {
        // In all other cases, just set the input value back to the selected model's name
        textInput.value = model.value.name;
    }
}

function clear() {
    model.value = undefined;
    textInput.value = '';
    root.value!.querySelector('input')!.focus();
}

function handleKeyboardInput(evt: KeyboardEvent) {
    if (evt.code === 'Escape') {
        focusOut(null);
        (document.activeElement! as HTMLElement).blur();
    }
}
</script>

<template>
    <!-- Container for input field and suggestion buttons -->
    <div
        ref="root"
        class="group relative rounded-t-lg focus-within:bg-input-bg"
        :class="{ 'rounded-b-lg': !textInput && computedSuggestions.length == 0 }"
        @focusin="focusIn()"
        @focusout="focusOut($event)"
        @keyup="handleKeyboardInput($event)"
    >
        <TextInput
            v-model="textInput"
            class="group-focus-within:bg-input-bg group-focus-within:shadow-none has-[:focus-visible]:relative has-[:focus-visible]:z-20"
            :type="$props.type"
            :placeholder="props.placeholder"
            :required="props.required"
            :show-required-indicator="!focused"
        />
        <button
            v-show="focused && textInput"
            class="material-symbols-outlined focus-visible:outline-default absolute -right-10 top-1/2 my-auto -translate-y-1/2 rounded-md p-1 text-2xl text-tertiary hover:text-main"
            @click.prevent="clear"
        >
            backspace
        </button>
        <div
            class="absolute z-10 hidden w-full rounded-b-lg shadow-md group-focus-within:block group-focus-within:bg-input-bg"
        >
            <AutoCompleteEntry
                v-show="textInput && exactMatch == null"
                @click.prevent="emit('requestCreate', textInput.trim())"
            >
                Erstelle <b>{{ textInput }}</b>
            </AutoCompleteEntry>
            <AutoCompleteEntry
                v-for="suggestion of computedSuggestions"
                :key="suggestion.suggestion.id"
                @click.prevent="pick(suggestion.suggestion)"
            >
                <span v-show="suggestion.matchFromIndex > 0">{{
                    suggestion.suggestion.name.substring(0, suggestion.matchFromIndex)
                }}</span>
                <b>{{
                    suggestion.suggestion.name.substring(
                        suggestion.matchFromIndex,
                        suggestion.matchToIndex
                    )
                }}</b>
                <span v-show="suggestion.matchToIndex < suggestion.suggestion.name.length">{{
                    suggestion.suggestion.name.substring(suggestion.matchToIndex)
                }}</span>
            </AutoCompleteEntry>
        </div>
    </div>
</template>
