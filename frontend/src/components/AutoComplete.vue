<script setup lang="ts">
import PvAutoComplete from 'primevue/autocomplete';
import Button from 'primevue/button';
import { computed, ref, watch } from 'vue';

import { normalizeStrings } from '@/common';
import type { CategoryShopOption } from '@/stores/CategoryShopStore';

const props = withDefaults(
    defineProps<{
        suggestions: CategoryShopOption[];
        suggestCreateObject?: boolean;
    }>(),
    {
        suggestCreateObject: false
    }
);

const emit = defineEmits<{
    (e: 'create', name: string): void;
}>();

// Hack to make the PvAutoComplete hide function available
const pvAutoComplete = ref<
    InstanceType<typeof PvAutoComplete> & { hide: () => void }
>();

const filteredSuggestions = ref<CategoryShopOption[]>([]);
const lastQuery = ref('');

// Compute `exactMatch` from raw input instead of on update because @complete fires with a bit of a delay
const inputText = ref('');
const exactMatch = computed(() => {
    return props.suggestions.some((s) => s.name === inputText.value);
});

function search(event: { query: string }) {
    lastQuery.value = event.query;
    const normalized = normalizeStrings(event.query.toLowerCase().trim());

    const matches = props.suggestions.filter((s) =>
        normalizeStrings(s.name.toLowerCase()).includes(normalized)
    );

    matches.sort((a, b) => {
        if (a.id === null) {
            return -1;
        } else if (b.id === null) {
            return 1;
        } else if (a.name == event.query) {
            return -1;
        } else if (b.name == event.query) {
            return 1;
        } else {
            return a.name.localeCompare(b.name);
        }
    });
    filteredSuggestions.value = matches;
}

watch(props, () => {
    search({ query: lastQuery.value });
});

function hide() {
    pvAutoComplete.value?.hide();
}

defineExpose({ hide });
</script>

<template>
    <PvAutoComplete
        ref="pvAutoComplete"
        :suggestions="filteredSuggestions"
        option-label="name"
        fluid
        dropdown
        force-selection
        @complete="search"
        @input="
            (e: Event) => (inputText = (e.target as HTMLInputElement).value)
        "
    >
        <template #header>
            <div
                v-if="
                    suggestCreateObject && !exactMatch && lastQuery.length > 0
                "
                class="border-surface border-b p-1"
            >
                <Button
                    label="Neu erstellen"
                    fluid
                    severity="secondary"
                    text
                    size="small"
                    icon="pi pi-plus"
                    @click="emit('create', lastQuery)"
                />
            </div>
        </template>
    </PvAutoComplete>
</template>
