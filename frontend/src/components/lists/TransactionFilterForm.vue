<script setup lang="ts">
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import DatePicker from 'primevue/datepicker';
import RadioButton from 'primevue/radiobutton';
import { computed, ref } from 'vue';

import { dateToIsoDate } from '@/common';
import AutoComplete from '@/components/autocomplete/AutoComplete.vue';
import CurrencyInput from '@/components/input/CurrencyInput.vue';
import MonthInput from '@/components/input/MonthInput.vue';
import VerticalSlidingTransition from '@/components/transitions/VerticalSlidingTransition.vue';
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

function resetFilterRules() {
    filterRules.value = props.defaultFilterRules;
    emit('reset', filterRules.value);
}

const dateFromModel = computed({
    get() {
        if (!filterRules.value.dateFrom) return null;
        return new Date(filterRules.value.dateFrom);
    },
    set(value: Date | null) {
        filterRules.value.dateFrom = value ? dateToIsoDate(value) : undefined;
    }
});

const dateToModel = computed({
    get() {
        if (!filterRules.value.dateTo) return null;
        return new Date(filterRules.value.dateTo);
    },
    set(value: Date | null) {
        filterRules.value.dateTo = value ? dateToIsoDate(value) : undefined;
    }
});
</script>

<template>
    <header class="grid grid-cols-3">
        <div class="col-start-2 flex justify-center gap-1 p-2 font-semibold">
            <span class="pi pi-filter" />
            <span>Filter</span>
        </div>
        <Button
            v-if="props.allowMinimizing"
            :icon="isExpanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
            text
            rounded
            size="small"
            class="m-1 self-center justify-self-end"
            @click.prevent="isExpanded = !isExpanded"
        />
    </header>
    <VerticalSlidingTransition
        duration-class="duration-200"
        :render="isExpanded || !allowMinimizing"
        class="border-t-[1px] border-tertiary-bg"
    >
        <form
            class="mx-4 min-h-0 self-end"
            @submit.prevent="emit('submit', filterRules)"
            @reset.prevent="resetFilterRules"
        >
            <section>
                <div class="flex items-center gap-2">
                    <RadioButton
                        v-model="filterRules.isExpense"
                        :value="undefined"
                        inputId="filter-all"
                    />
                    <label for="filter-all">Alle Transaktionen</label>
                </div>
                <div class="flex items-center gap-2">
                    <RadioButton
                        v-model="filterRules.isExpense"
                        :value="true"
                        inputId="filter-expense"
                    />
                    <label for="filter-expense">Geldausgänge</label>
                </div>
                <div class="flex items-center gap-2">
                    <RadioButton
                        v-model="filterRules.isExpense"
                        :value="false"
                        inputId="filter-income"
                    />
                    <label for="filter-income">Geldeingänge</label>
                </div>

                <div class="mt-4 flex items-center gap-2">
                    <Checkbox
                        v-model="filterRules.isRecurringTransaction"
                        :binary="true"
                        inputId="filter-recurring"
                    />
                    <label for="filter-recurring">Wiederkehrende Umsätze</label>
                </div>
            </section>

            <section v-if="!filterRules.isRecurringTransaction" class="vertical-form">
                <label>ab</label>
                <DatePicker v-model="dateFromModel" dateFormat="dd.mm.yy" showIcon fluid />

                <label>bis</label>
                <DatePicker v-model="dateToModel" dateFormat="dd.mm.yy" showIcon fluid />
            </section>

            <section v-else class="vertical-form">
                <label>Beginn vor</label>
                <MonthInput v-model="filterRules.intervalStartsLe" />

                <label>Ende nach</label>
                <MonthInput v-model="filterRules.intervalEndsGe" />
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
                    <Button label="Suchen" type="submit" severity="success" />
                    <Button label="Zurücksetzen" type="reset" severity="secondary" />
                </div>
            </section>
        </form>
    </VerticalSlidingTransition>
</template>

<style scoped>
section {
    @apply flex flex-col gap-2 py-4;

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
