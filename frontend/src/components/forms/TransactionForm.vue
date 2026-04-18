<script setup lang="ts">
import Button from 'primevue/button';
import DatePicker from 'primevue/datepicker';
import FieldSet from 'primevue/fieldset';
import FloatLabel from 'primevue/floatlabel';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import RadioButton from 'primevue/radiobutton';
import RadioButtonGroup from 'primevue/radiobuttongroup';
import { useToast } from 'primevue/usetoast';
import { computed, ref, watch } from 'vue';

import { Form } from '@primevue/forms';
import type { FormInstance, FormResolverOptions, FormSubmitEvent } from '@primevue/forms';
import { templateRef, useDateFormat, useNow } from '@vueuse/core';

import { dateToIsoDate, dateToYearMonth } from '@/common';
import AutoComplete from '@/components/autocomplete/AutoComplete.vue';
import { useCategoryShopStore } from '@/stores/CategoryShopStore';
import {
    OneoffTransaction,
    Recurrence,
    RecurringTransaction,
    useTransactionStore
} from '@/stores/TransactionStore';

type FormValues = {
    type: 'expense' | 'income';
    recurrence: 'oneoff-today' | 'oneoff-yesterday' | 'oneoff-custom' | 'monthly' | 'yearly';
    date?: Date;
    monthFrom?: Date;
    monthTo?: Date;
    yearFrom?: Date;
    yearTo?: Date;
    category?: string;
    shop?: string;
    amount?: number;
    description?: string;
};

const props = defineProps<{
    transaction?: OneoffTransaction | RecurringTransaction;
    showCancelButton?: boolean;
}>();

const emit = defineEmits<{
    done: [];
}>();

const CategoryShopStore = useCategoryShopStore();
const TransactionStore = useTransactionStore();
const initialValues = ref<FormValues>({ type: 'expense', recurrence: 'oneoff-today' });
const toast = useToast();
const form = templateRef<FormInstance>('form');
const categoryAutoComplete = templateRef<InstanceType<typeof AutoComplete>>('categoryAutoComplete');
const shopAutoComplete = templateRef<InstanceType<typeof AutoComplete>>('shopAutoComplete');

const today = useNow();
const yesterday = computed(() => {
    const d = new Date(today.value);
    d.setDate(d.getDate() - 1);
    return d;
});
const formattedToday = useDateFormat(today, 'dddd, DD.MM.YYYY');
const formattedYesterday = useDateFormat(yesterday, 'dddd, DD.MM.YYYY');

const isEditDialog = ref(false);

type Lock = 'submit' | 'create_category' | 'create_shop';
const locks = ref<Set<Lock>>(new Set());

function resolver({ values }: FormResolverOptions) {
    // TODO look at
    const invalid = (field: string) => ({ [field]: [{ message: '' }] });
    let errors: Record<string, { message: string }[]> = {};

    if (values.amount == null) Object.assign(errors, invalid('amount'));
    if (!values.category) Object.assign(errors, invalid('category'));

    if (values.recurrence === 'oneoff-custom') {
        if (!values.date) Object.assign(errors, invalid('date'));
    } else if (values.recurrence === 'monthly') {
        if (!values.monthFrom) Object.assign(errors, invalid('monthFrom'));
        if (
            values.monthTo &&
            values.monthFrom &&
            new Date(values.monthTo) < new Date(values.monthFrom)
        )
            Object.assign(errors, invalid('monthTo'));
    } else if (values.recurrence === 'yearly') {
        if (!values.yearFrom) Object.assign(errors, invalid('yearFrom'));
        if (values.yearTo && values.yearFrom && new Date(values.yearTo) < new Date(values.yearFrom))
            Object.assign(errors, invalid('yearTo'));
    }

    return { values, errors };
}

// TODO work
watch(props, (value: { transaction: OneoffTransaction | RecurringTransaction | undefined }) => {}, {
    immediate: true
});

async function createCategoryShop(type: 'category' | 'shop', name: string) {
    locks.value.add(`create_${type}`);
    try {
        const created = await CategoryShopStore.create(type, name);
        if (type === 'category') {
            form.value.setFieldValue('category', created.name);
        } else {
            form.value.setFieldValue('shop', created.name);
        }
    } catch (e) {
        console.log(e);
        toast.add({
            severity: 'error',
            summary: `${type === 'category' ? 'Kategorie' : 'Händler'} kann nicht erstellt werden`,
            life: 3000
        });
    }
    locks.value.delete(`create_${type}`);
}

const submitForm = async (evt: FormSubmitEvent<Record<string, any>>) => {
    if (!evt.valid) {
        toast.add({ severity: 'error', summary: 'Ungültiges Formular', life: 3000 });
        return;
    }

    locks.value.add('submit');
    let values = evt.values as FormValues;

    try {
        let basePayload = {
            isExpense: values.type == 'expense',
            amount: values.amount!,
            categoryId: CategoryShopStore.categories[values.category!].id,
            shopId: values.shop ? CategoryShopStore.shops[values.shop!].id : undefined,
            description: values.description || undefined
        };

        const isRecurring = values.recurrence === 'monthly' || values.recurrence === 'yearly';

        const buildRecurrence = (): Recurrence => {
            if (values.recurrence === 'monthly') {
                return {
                    frequency: 'monthly',
                    monthFrom: dateToYearMonth(values.monthFrom!),
                    monthTo: values.monthTo ? dateToYearMonth(values.monthTo) : undefined
                };
            } else {
                return {
                    frequency: 'yearly',
                    yearFrom: values.yearFrom!.getFullYear(),
                    yearTo: values.yearTo ? values.yearTo.getFullYear() : undefined
                };
            }
        };

        const buildDate = (): string => {
            if (values.recurrence === 'oneoff-today') return dateToIsoDate(today.value);
            if (values.recurrence === 'oneoff-yesterday') return dateToIsoDate(yesterday.value);
            return dateToIsoDate(values.date!);
        };

        if (isEditDialog.value) {
            const transaction = props.transaction!;
            if (isRecurring) {
                await TransactionStore.update('recurring', transaction.id, {
                    ...basePayload,
                    recurrence: buildRecurrence()
                });
            } else {
                await TransactionStore.update('oneoff', transaction.id, {
                    ...basePayload,
                    date: buildDate()
                });
            }
        } else {
            if (isRecurring) {
                await TransactionStore.create('recurring', {
                    ...basePayload,
                    recurrence: buildRecurrence()
                });
            } else {
                await TransactionStore.create('oneoff', {
                    ...basePayload,
                    date: buildDate()
                });
            }
        }

        emit('done');
    } catch (err) {
        console.error(err);
        toast.add({ severity: 'error', summary: 'Ungültiges Formular', life: 3000 });
    } finally {
        locks.value.delete('submit');
    }
};
</script>

<template>
    <Form
        ref="form"
        v-slot="$form"
        :initialValues
        :resolver="resolver"
        class="flex flex-col gap-2"
        @submit="submitForm"
    >
        <FieldSet legend="Typ">
            <RadioButtonGroup name="type" class="flex flex-col gap-1">
                <label class="flex items-center gap-2">
                    <RadioButton value="expense" />
                    Geldausgang
                </label>
                <label class="flex items-center gap-2">
                    <RadioButton value="income" />
                    Geldeingang
                </label>
            </RadioButtonGroup>
        </FieldSet>
        <FieldSet v-if="!isEditDialog" legend="Häufigkeit?">
            <RadioButtonGroup name="recurrence" class="flex w-full flex-col gap-1">
                <label class="flex items-center gap-2">
                    <RadioButton value="oneoff-today" />
                    Einmalig, heute ({{ formattedToday }})
                </label>
                <label class="flex items-center gap-2">
                    <RadioButton value="oneoff-yesterday" />
                    Einmalig, gestern ({{ formattedYesterday }})
                </label>
                <label class="flex items-center gap-2">
                    <RadioButton value="oneoff-custom" />
                    Einmalig, anderer Tag
                </label>
                <label class="flex items-center gap-2">
                    <RadioButton value="monthly" />
                    Monatlich
                </label>
                <label class="flex items-center gap-2">
                    <RadioButton value="yearly" />
                    Jährlich
                </label>
            </RadioButtonGroup>
            <div v-if="$form.recurrence?.value === 'oneoff-custom'" class="mt-4">
                <FloatLabel variant="on" class="flex-1">
                    <DatePicker name="date" inputId="date" dateFormat="dd.mm.yy" fluid></DatePicker>
                    <label for="date">Datum</label>
                </FloatLabel>
            </div>
            <div v-if="$form.recurrence?.value === 'monthly'" class="mt-4 flex gap-2 msm:flex-col">
                <FloatLabel variant="on" class="flex-1">
                    <DatePicker
                        name="monthFrom"
                        inputId="monthFrom"
                        view="month"
                        dateFormat="mm.yy"
                        fluid
                    ></DatePicker>
                    <label for="monthFrom">Anfang</label>
                </FloatLabel>
                <FloatLabel variant="on" class="flex-1">
                    <DatePicker
                        name="monthTo"
                        inputId="monthTo"
                        view="month"
                        dateFormat="mm.yy"
                        fluid
                    ></DatePicker>
                    <label for="monthTo">Ende (inkl.)</label>
                </FloatLabel>
            </div>
            <div v-if="$form.recurrence?.value === 'yearly'" class="mt-4 flex gap-2 msm:flex-col">
                <FloatLabel variant="on" class="flex-1">
                    <DatePicker
                        name="yearFrom"
                        inputId="yearFrom"
                        view="year"
                        dateFormat="yy"
                        fluid
                    ></DatePicker>
                    <label for="yearFrom">Anfang</label>
                </FloatLabel>
                <FloatLabel variant="on" class="flex-1">
                    <DatePicker
                        name="yearTo"
                        inputId="yearTo"
                        view="year"
                        dateFormat="yy"
                        fluid
                    ></DatePicker>
                    <label for="yearTo">Ende (inkl.)</label>
                </FloatLabel>
            </div>
        </FieldSet>

        <FieldSet legend="Transaktion">
            <div class="flex flex-col gap-2">
                <FloatLabel variant="on">
                    <InputNumber
                        inputId="amount"
                        name="amount"
                        mode="currency"
                        currency="EUR"
                        fluid
                    />
                    <label for="amount">Betrag</label>
                </FloatLabel>

                <FloatLabel variant="on">
                    <AutoComplete
                        ref="categoryAutoComplete"
                        inputId="category"
                        name="category"
                        :suggestions="Object.keys(CategoryShopStore.categories)"
                        required
                        :suggest-create-object="true"
                        @create="
                            async (name) => {
                                await createCategoryShop('category', name);
                                categoryAutoComplete?.hide();
                            }
                        "
                        :loading="locks.has('create_category')"
                    />
                    <label for="category">Kategorie</label>
                </FloatLabel>

                <FloatLabel variant="on">
                    <AutoComplete
                        ref="shopAutoComplete"
                        inputId="shop"
                        name="shop"
                        :suggestions="Object.keys(CategoryShopStore.shops)"
                        :suggest-create-object="true"
                        @create="
                            async (name) => {
                                await createCategoryShop('shop', name);
                                shopAutoComplete?.hide();
                            }
                        "
                        :loading="locks.has('create_shop')"
                    />
                    <label for="shop">Händler</label>
                </FloatLabel>

                <FloatLabel variant="on">
                    <InputText inputId="description" name="description" fluid />
                    <label for="description">Beschreibung</label>
                </FloatLabel>
                <div></div>
            </div>
        </FieldSet>

        <div class="flex justify-center gap-2">
            <Button
                type="submit"
                label="Speichern"
                severity="success"
                :loading="locks.size > 0"
                :disabled="locks.size > 0"
            />
            <Button
                v-if="showCancelButton"
                type="button"
                :label="props.transaction ? 'Abbrechen' : 'Verwerfen'"
                severity="secondary"
                @click="emit('done')"
            />
        </div>
    </Form>
</template>

<style scoped>
h2 {
    @apply text-xl;
}

section {
    text-align: left;
}
</style>
