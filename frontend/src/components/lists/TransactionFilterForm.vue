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
}>();

const filterRules = ref(props.defaultFilterRules);

const emit = defineEmits<{
    submit: [filterRules: TransactionFilterRules];
    reset: [filterRules: TransactionFilterRules];
}>();

function resetFilterRules() {
    filterRules.value = props.defaultFilterRules;
    emit('reset', filterRules.value);
}
</script>

<template>
    <header>
        <h1 class="bg-header-bg p-2 text-xl text-main-dark">Filter</h1>
    </header>
    <form
        class="mx-4"
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
