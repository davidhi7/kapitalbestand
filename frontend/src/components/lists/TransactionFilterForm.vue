<script setup lang="ts">
import { ref } from 'vue';

import AutoComplete from '@/components/autocomplete/AutoComplete.vue';
import CurrencyInput from '@/components/input/CurrencyInput.vue';
import MonthInput from '@/components/input/MonthInput.vue';
import TextInput from '@/components/input/TextInput.vue';
import { useCategoryShopStore } from '@/stores/CategoryShopStore';
import type { TransactionFilterRules } from '@/stores/TransactionStore';

const CategoryShopStore = useCategoryShopStore();

const props = defineProps<{
    defaultFilterRules: TransactionFilterRules;
    allowMinimizing: boolean;
}>();

const isExpanded = ref(!props.allowMinimizing);
const filterRules = ref(props.defaultFilterRules);

const emit = defineEmits<{
    submit: [filterRules: TransactionFilterRules];
    reset: [filterRules: TransactionFilterRules];
}>();
true;
function resetFilterRules() {
    filterRules.value = props.defaultFilterRules;
    emit('reset', filterRules.value);
}
</script>

<template>
    <header
        class="grid grid-cols-3"
        :class="{ 'border-b-[1px] border-tertiary-bg': isExpanded || !allowMinimizing }"
    >
        <span class="col-start-2 flex justify-center gap-1 p-2 font-semibold">
            <span class="material-symbols-outlined place-self-center text-xl">filter_alt</span>
            Filter
        </span>
        <button
            v-if="props.allowMinimizing"
            class="mx-1 grid aspect-square content-center self-center justify-self-end rounded-md transition-colors hover:bg-tertiary-bg"
            @click.prevent="isExpanded = !isExpanded"
        >
            <span
                class="material-symbols-outlined p-1 text-2xl transition-transform duration-200"
                :class="{ 'rotate-180': isExpanded }"
                >expand_more</span
            >
        </button>
    </header>
    <main
        class="grid grid-rows-[0fr] overflow-hidden transition-grid-rows"
        :class="{
            'grid-rows-[1fr]': isExpanded || !allowMinimizing
        }"
    >
        <form
            class="mx-4 min-h-0 self-end"
            @submit.prevent="emit('submit', filterRules)"
            @reset.prevent="resetFilterRules"
        >
            <section>
                <label>
                    <input v-model="filterRules.isExpense" type="radio" :value="undefined" />
                    Alle Transaktionen
                </label>
                <label>
                    <input v-model="filterRules.isExpense" type="radio" :value="true" />
                    Geldausgänge
                </label>
                <label>
                    <input v-model="filterRules.isExpense" type="radio" :value="false" />
                    Geldeingänge
                </label>

                <label class="mt-4">
                    <input v-model="filterRules.isMonthlyTransaction" type="checkbox" />
                    Monatliche Umsätze
                </label>
            </section>

            <section v-if="!filterRules.isMonthlyTransaction" class="vertical-form">
                <label>ab</label>
                <TextInput v-model.lazy="filterRules.dateFrom" type="date" />

                <label>bis</label>
                <TextInput v-model.lazy="filterRules.dateTo" type="date" />
            </section>

            <section v-else class="vertical-form">
                <label>ab Monat</label>
                <MonthInput v-model="filterRules.monthFrom" />

                <label>bis Monat</label>
                <MonthInput v-model="filterRules.monthTo" />
            </section>

            <section class="vertical-form">
                <label>Kategorie</label>
                <AutoComplete
                    v-model="filterRules.Category"
                    :suggestions="CategoryShopStore.categories"
                />

                <label>Händler</label>
                <AutoComplete v-model="filterRules.Shop" :suggestions="CategoryShopStore.shops" />
            </section>

            <section class="vertical-form">
                <label>ab Betrag</label>
                <CurrencyInput v-model="filterRules.amountFrom" />

                <label>bis Betrag</label>
                <CurrencyInput v-model="filterRules.amountTo" />
            </section>

            <section>
                <div class="flex justify-center gap-2">
                    <button class="btn btn-green" type="submit">Suchen</button>
                    <button class="btn" type="reset">Zurücksetzen</button>
                </div>
            </section>
        </form>
    </main>
</template>

<style scoped>
label > :is(input[type='checkbox'], input[type='radio']) {
    @apply mr-2;
}

section {
    @apply flex flex-col py-4;

    &.vertical-form {
        > :nth-child(odd) {
            @apply relative left-2 text-secondary;
        }

        > :nth-child(even) {
            @apply mb-2;
        }
    }
}
</style>
