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
import { computed, onActivated, ref, useTemplateRef, watch } from 'vue';

import { Form } from '@primevue/forms';
import type {
    FormInstance,
    FormResolverOptions,
    FormSubmitEvent
} from '@primevue/forms';
import { useDateFormat } from '@vueuse/core';

import { dateToIsoDate, dateToYearMonth, parseYearMonth } from '@/common';
import AutoComplete from '@/components/AutoComplete.vue';
import { useCategoryShopStore } from '@/stores/CategoryShopStore';
import {
    OneoffTransaction,
    Recurrence,
    RecurringTransaction,
    isOneoffTransaction,
    useTransactionStore
} from '@/stores/TransactionStore';

type FormValues = {
    type: 'expense' | 'income';
    recurrence:
        | 'oneoff-today'
        | 'oneoff-yesterday'
        | 'oneoff-custom'
        | 'monthly'
        | 'yearly';
    category?: string;
    shop?: string;
    amount?: number;
    description?: string;
};

// Date fields live outside the Form due to a PrimeVue regression (4.4.0+):
// <DatePicker> inside <Form> doesn't render its input value from initialValues
// until the user opens the popup (and then broken). See primefaces/primevue#8191.
type DateFields = {
    date?: Date;
    monthFrom?: Date;
    monthTo?: Date;
    yearFrom?: Date;
    yearTo?: Date;
};
const dateField = ref<Date | undefined>();
const monthFromField = ref<Date | undefined>();
const monthToField = ref<Date | undefined>();
const yearFromField = ref<Date | undefined>();
const yearToField = ref<Date | undefined>();
// Tracks whether the user has attempted submit, so date-field error styling
// only appears after the first submit attempt (matching Form's default UX).
const dateFieldsSubmitted = ref(false);

const props = defineProps<{
    transaction?: OneoffTransaction | RecurringTransaction;
    showCancelButton?: boolean;
}>();

const emit = defineEmits<{
    done: [];
}>();

const CategoryShopStore = useCategoryShopStore();
const TransactionStore = useTransactionStore();
const toast = useToast();
const form = useTemplateRef<FormInstance>('form');
const categoryAutoComplete = useTemplateRef<InstanceType<typeof AutoComplete>>(
    'categoryAutoComplete'
);
const shopAutoComplete =
    useTemplateRef<InstanceType<typeof AutoComplete>>('shopAutoComplete');

const today = ref(new Date());
const yesterday = ref(new Date());
const setDates = () => {
    today.value = new Date();
    yesterday.value = new Date(today.value);
    yesterday.value.setDate(yesterday.value.getDate() - 1);
};
setDates();
onActivated(setDates);
const formattedToday = useDateFormat(today, 'dddd, DD.MM.YYYY');
const formattedYesterday = useDateFormat(yesterday, 'dddd, DD.MM.YYYY');

const mode = computed<'create' | 'edit-oneoff' | 'edit-recurring'>(() => {
    if (props.transaction === undefined) return 'create';
    return isOneoffTransaction(props.transaction)
        ? 'edit-oneoff'
        : 'edit-recurring';
});

type Lock = 'submit' | 'create_category' | 'create_shop';
const locks = ref<Set<Lock>>(new Set());

// Custom form validation function
function resolver({ values }: FormResolverOptions) {
    const invalid = (field: string) => ({ [field]: [{ message: '' }] });
    let errors: Record<string, { message: string }[]> = {};

    if (values.amount == null) Object.assign(errors, invalid('amount'));
    if (!values.category) Object.assign(errors, invalid('category'));

    return { values, errors };
}

// Date fields are validated outside the Form (see DateFields comment above).
function datesValid(recurrence: FormValues['recurrence']): boolean {
    if (recurrence === 'oneoff-custom') return !!dateField.value;
    if (recurrence === 'monthly') {
        if (!monthFromField.value) return false;
        if (monthToField.value && monthToField.value < monthFromField.value)
            return false;
        return true;
    }
    if (recurrence === 'yearly') {
        if (!yearFromField.value) return false;
        if (yearToField.value && yearToField.value < yearFromField.value)
            return false;
        return true;
    }
    return true;
}

const dateInvalid = computed(
    () => dateFieldsSubmitted.value && !dateField.value
);
const monthFromInvalid = computed(
    () => dateFieldsSubmitted.value && !monthFromField.value
);
const monthToInvalid = computed(
    () =>
        dateFieldsSubmitted.value &&
        monthToField.value !== undefined &&
        monthFromField.value !== undefined &&
        monthToField.value < monthFromField.value
);
const yearFromInvalid = computed(
    () => dateFieldsSubmitted.value && !yearFromField.value
);
const yearToInvalid = computed(
    () =>
        dateFieldsSubmitted.value &&
        yearToField.value !== undefined &&
        yearFromField.value !== undefined &&
        yearToField.value < yearFromField.value
);

function buildInitialState(
    transaction?: OneoffTransaction | RecurringTransaction
): { form: FormValues; dates: DateFields } {
    if (transaction === undefined) {
        return {
            form: { type: 'expense', recurrence: 'oneoff-today' },
            dates: {}
        };
    }

    const base = {
        type: (transaction.isExpense ? 'expense' : 'income') as
            | 'expense'
            | 'income',
        amount: transaction.amount / 100,
        category: transaction.category,
        shop: transaction.shop,
        description: transaction.description
    };

    if (isOneoffTransaction(transaction)) {
        const dateIso = transaction.date;
        if (dateIso === dateToIsoDate(today.value)) {
            return {
                form: { ...base, recurrence: 'oneoff-today' },
                dates: {}
            };
        }
        if (dateIso === dateToIsoDate(yesterday.value)) {
            return {
                form: { ...base, recurrence: 'oneoff-yesterday' },
                dates: {}
            };
        }
        return {
            form: { ...base, recurrence: 'oneoff-custom' },
            dates: { date: new Date(transaction.date) }
        };
    }

    if (transaction.recurrence.frequency === 'monthly') {
        const { monthFrom, monthTo } = transaction.recurrence;
        return {
            form: { ...base, recurrence: 'monthly' },
            dates: {
                monthFrom: parseYearMonth(monthFrom),
                monthTo: monthTo ? parseYearMonth(monthTo) : undefined
            }
        };
    }

    const { yearFrom, yearTo } = transaction.recurrence;
    return {
        form: { ...base, recurrence: 'yearly' },
        dates: {
            yearFrom: new Date(yearFrom, 0, 1),
            yearTo: yearTo ? new Date(yearTo, 0, 1) : undefined
        }
    };
}

const initialValues = computed<FormValues>(
    () => buildInitialState(props.transaction).form
);

watch(
    () => props.transaction,
    (transaction) => {
        const { dates } = buildInitialState(transaction);
        dateField.value = dates.date;
        monthFromField.value = dates.monthFrom;
        monthToField.value = dates.monthTo;
        yearFromField.value = dates.yearFrom;
        yearToField.value = dates.yearTo;
        dateFieldsSubmitted.value = false;
    },
    { immediate: true }
);

async function createCategoryShop(type: 'category' | 'shop', name: string) {
    locks.value.add(`create_${type}`);
    try {
        const created = await CategoryShopStore.create(type, name);
        if (!form.value) {
            console.error('Form ref is null, cannot set field value');
        } else if (type === 'category') {
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
    let values = evt.values as FormValues;
    dateFieldsSubmitted.value = true;
    if (!evt.valid || !datesValid(values.recurrence)) {
        toast.add({
            severity: 'error',
            summary: 'Ungültiges Formular',
            life: 3000
        });
        return;
    }

    locks.value.add('submit');

    try {
        let basePayload = {
            isExpense: values.type == 'expense',
            amount: Math.round(values.amount! * 100),
            categoryId: CategoryShopStore.categories[values.category!].id,
            shopId: values.shop
                ? CategoryShopStore.shops[values.shop!].id
                : undefined,
            description: values.description || undefined
        };

        const isRecurring =
            values.recurrence === 'monthly' || values.recurrence === 'yearly';

        const buildRecurrence = (): Recurrence => {
            if (values.recurrence === 'monthly') {
                return {
                    frequency: 'monthly',
                    monthFrom: dateToYearMonth(monthFromField.value!),
                    monthTo: monthToField.value
                        ? dateToYearMonth(monthToField.value)
                        : undefined
                };
            } else {
                return {
                    frequency: 'yearly',
                    yearFrom: yearFromField.value!.getFullYear(),
                    yearTo: yearToField.value?.getFullYear()
                };
            }
        };

        const buildDate = (): string => {
            if (values.recurrence === 'oneoff-today')
                return dateToIsoDate(today.value);
            if (values.recurrence === 'oneoff-yesterday')
                return dateToIsoDate(yesterday.value);
            return dateToIsoDate(dateField.value!);
        };

        if (mode.value !== 'create') {
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
            toast.add({
                severity: 'info',
                summary: 'Transaktion aktualisiert',
                life: 3000
            });
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
            toast.add({
                severity: 'info',
                summary: 'Transaktion erstellt',
                life: 3000
            });
        }

        emit('done');
    } catch (err) {
        console.error(err);
        toast.add({
            severity: 'error',
            summary: 'Ungültiges Formular',
            life: 3000
        });
    } finally {
        locks.value.delete('submit');
    }
};
</script>

<template>
    <!-- key attribute is used to reactively update the initialValues if the underlying transaction changes -->
    <Form
        ref="form"
        v-slot="$form"
        :key="props.transaction?.id ?? 'create'"
        :initial-values
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
        <FieldSet legend="Häufigkeit">
            <RadioButtonGroup
                name="recurrence"
                class="flex w-full flex-col gap-1"
            >
                <label
                    v-if="mode !== 'edit-recurring'"
                    class="flex items-center gap-2"
                >
                    <RadioButton value="oneoff-today" />
                    Einmalig, heute
                    <span class="text-tertiary">{{ formattedToday }}</span>
                </label>
                <label
                    v-if="mode !== 'edit-recurring'"
                    class="flex items-center gap-2"
                >
                    <RadioButton value="oneoff-yesterday" />
                    Einmalig, gestern
                    <span class="text-tertiary">{{ formattedYesterday }}</span>
                </label>
                <label
                    v-if="mode !== 'edit-recurring'"
                    class="flex items-center gap-2"
                >
                    <RadioButton value="oneoff-custom" />
                    Einmalig, anderer Tag
                </label>
                <label
                    v-if="mode !== 'edit-oneoff'"
                    class="flex items-center gap-2"
                >
                    <RadioButton value="monthly" />
                    Monatlich
                </label>
                <label
                    v-if="mode !== 'edit-oneoff'"
                    class="flex items-center gap-2"
                >
                    <RadioButton value="yearly" />
                    Jährlich
                </label>
            </RadioButtonGroup>
            <div
                v-if="
                    ($form.recurrence?.value ?? initialValues.recurrence) ===
                    'oneoff-custom'
                "
                class="mt-4"
            >
                <FloatLabel variant="on" class="flex-1">
                    <DatePicker
                        v-model="dateField"
                        :invalid="dateInvalid"
                        input-id="date"
                        date-format="dd.mm.yy"
                        fluid
                    ></DatePicker>
                    <label for="date">Datum</label>
                </FloatLabel>
            </div>
            <div
                v-if="
                    ($form.recurrence?.value ?? initialValues.recurrence) ===
                    'monthly'
                "
                class="mt-4 flex gap-2 max-sm:flex-col"
            >
                <FloatLabel variant="on" class="flex-1">
                    <DatePicker
                        v-model="monthFromField"
                        :invalid="monthFromInvalid"
                        input-id="monthFrom"
                        view="month"
                        date-format="mm.yy"
                        fluid
                    >
                    </DatePicker>
                    <label for="monthFrom">Erster Monat</label>
                </FloatLabel>
                <FloatLabel variant="on" class="flex-1">
                    <DatePicker
                        v-model="monthToField"
                        :invalid="monthToInvalid"
                        input-id="monthTo"
                        view="month"
                        date-format="mm.yy"
                        fluid
                    ></DatePicker>
                    <label for="monthTo">Letzter Monat (inkl.)</label>
                </FloatLabel>
            </div>
            <div
                v-if="
                    ($form.recurrence?.value ?? initialValues.recurrence) ===
                    'yearly'
                "
                class="mt-4 flex gap-2 max-sm:flex-col"
            >
                <FloatLabel variant="on" class="flex-1">
                    <DatePicker
                        v-model="yearFromField"
                        :invalid="yearFromInvalid"
                        input-id="yearFrom"
                        view="year"
                        date-format="yy"
                        fluid
                    ></DatePicker>
                    <label for="yearFrom">Erstes Jahr</label>
                </FloatLabel>
                <FloatLabel variant="on" class="flex-1">
                    <DatePicker
                        v-model="yearToField"
                        :invalid="yearToInvalid"
                        input-id="yearTo"
                        view="year"
                        date-format="yy"
                        fluid
                    ></DatePicker>
                    <label for="yearTo">Letztes Jahr (inkl.)</label>
                </FloatLabel>
            </div>
        </FieldSet>

        <FieldSet legend="Transaktion">
            <div class="flex flex-col gap-2">
                <FloatLabel variant="on">
                    <InputNumber
                        input-id="amount"
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
                        input-id="category"
                        name="category"
                        :suggestions="Object.keys(CategoryShopStore.categories)"
                        required
                        :suggest-create-object="true"
                        :loading="locks.has('create_category')"
                        @create="
                            async (name) => {
                                await createCategoryShop('category', name);
                                categoryAutoComplete?.hide();
                            }
                        "
                    />
                    <label for="category">Kategorie</label>
                </FloatLabel>

                <FloatLabel variant="on">
                    <AutoComplete
                        ref="shopAutoComplete"
                        input-id="shop"
                        name="shop"
                        :suggestions="Object.keys(CategoryShopStore.shops)"
                        :suggest-create-object="true"
                        :loading="locks.has('create_shop')"
                        show-clear
                        @create="
                            async (name) => {
                                await createCategoryShop('shop', name);
                                shopAutoComplete?.hide();
                            }
                        "
                    />
                    <label for="shop">Händler</label>
                </FloatLabel>

                <FloatLabel variant="on">
                    <InputText
                        input-id="description"
                        name="description"
                        fluid
                    />
                    <label for="description">Beschreibung</label>
                </FloatLabel>
                <div></div>
            </div>
        </FieldSet>

        <!-- pt-2 to match the padding of the fieldset label -->
        <div class="flex justify-end gap-2 pt-2">
            <!-- TODO make this a button that conditionally resets or closes the dialog -->
            <Button
                v-if="showCancelButton"
                type="button"
                :label="props.transaction ? 'Abbrechen' : 'Verwerfen'"
                severity="secondary"
                @click="emit('done')"
            />
            <Button
                v-else
                type="reset"
                label="Zurücksetzen"
                severity="secondary"
            ></Button>
            <Button
                type="submit"
                label="Speichern"
                severity="success"
                :loading="locks.size > 0"
                :disabled="locks.size > 0"
            />
        </div>
    </Form>
</template>
