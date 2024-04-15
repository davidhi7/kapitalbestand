<script setup lang="ts">
import { reactive, ref, watch } from 'vue';

import { Category, Shop } from '@backend-types/CategoryShopTypes';
import { MonthlyTransaction, OneoffTransaction } from '@backend-types/TransactionTypes';
import { useDateFormat, useNow } from '@vueuse/core';

import { dateToYearMonth, format_currency } from '@/common';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import { NotificationEvent, NotificationStyle, eventEmitter } from '@/components/Notification.vue';
import AutoComplete from '@/components/autocomplete/AutoComplete.vue';
import GridForm from '@/components/forms/GridForm.vue';
import CurrencyInput from '@/components/input/CurrencyInput.vue';
import MonthInput, { MonthType } from '@/components/input/MonthInput.vue';
import TextInput from '@/components/input/TextInput.vue';
import { useCategoryShopStore } from '@/stores/CategoryShopStore';
import { isOneoffTransaction, useTransactionStore } from '@/stores/TransactionStore';

const props = defineProps<{
    transaction?: OneoffTransaction | MonthlyTransaction;
    showCancelButton?: boolean;
}>();

const emit = defineEmits<{
    (e: 'done'): void;
}>();

const CategoryShopStore = useCategoryShopStore();
const TransactionStore = useTransactionStore();

const formattedDate = useDateFormat(useNow(), 'dddd, DD.MM.YYYY');
const transactionProperties: {
    monthlyTransactionProperties: {
        monthFrom: MonthType | undefined;
        monthTo: MonthType | undefined;
    };
    oneoffTransactionProperties: {
        today: boolean;
        customDate: string;
    };
    isExpense: boolean;
    amount: number | undefined;
    Category: Category | undefined;
    Shop: Shop | undefined;
    description: string;
} = reactive({
    monthlyTransactionProperties: {
        monthFrom: undefined,
        monthTo: undefined
    },
    oneoffTransactionProperties: {
        today: true,
        customDate: ''
    },
    isExpense: true,
    amount: undefined,
    Category: undefined,
    Shop: undefined,
    description: ''
});

const allowedTransactionType = ref<'any' | 'oneoff' | 'monthly'>('any');
const isMonthlyTransaction = ref(false);

const rawAmountInput = ref<string>('');
type Lock = 'submit' | 'createCategory' | 'createShop';
const submitLocks = ref<Set<Lock>>(new Set());

watch(
    props,
    (value: { transaction: OneoffTransaction | MonthlyTransaction | undefined }) => {
        const transaction = value.transaction;
        if (transaction == undefined) {
            allowedTransactionType.value = 'any';
            return;
        }

        const { isExpense, amount, Category, Shop, description } = transaction.Transaction;
        transactionProperties.isExpense = isExpense;
        transactionProperties.amount = amount;
        transactionProperties.description = description;
        transactionProperties.Category = Category;
        transactionProperties.Shop = Shop;
        rawAmountInput.value = format_currency(amount);

        if (isOneoffTransaction(transaction)) {
            allowedTransactionType.value = 'oneoff';
            var now = new Date();
            var today = new Date(
                Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
            );

            if (today.getTime() === new Date(transaction.date).getTime()) {
                transactionProperties.oneoffTransactionProperties.today = true;
            } else {
                transactionProperties.oneoffTransactionProperties.today = false;
                transactionProperties.oneoffTransactionProperties.customDate = transaction.date;
                isMonthlyTransaction.value = false;
            }
        } else {
            allowedTransactionType.value = 'monthly';
            const [fromYear, fromMonth] = transaction.monthFrom.split('-');
            transactionProperties.monthlyTransactionProperties.monthFrom = {
                year: Number(fromYear),
                month: Number(fromMonth)
            };
            if (transaction.monthTo) {
                const [toYear, toMonth] = transaction.monthTo.split('-');
                transactionProperties.monthlyTransactionProperties.monthTo = {
                    year: Number(toYear),
                    month: Number(toMonth)
                };
            }
            isMonthlyTransaction.value = true;
        }
    },
    { immediate: true }
);

async function createCategoryShop(type: 'Category' | 'Shop', name: string) {
    submitLocks.value.add(`create${type}`);
    transactionProperties[type] = await CategoryShopStore.create(type, name);
    submitLocks.value.delete(`create${type}`);
}

function submit() {
    submitLocks.value.add('submit');

    try {
        const { isExpense, amount, Category, Shop, description } = transactionProperties;

        if (!Category) {
            throw Error('`Category` is undefined');
        }

        if (!amount) {
            throw Error('`amount` is undefined');
        }

        let payload;
        let basePayload = {
            isExpense,
            amount,
            CategoryId: Category.id,
            ShopId: Shop?.id,
            description: description || undefined
        };

        if (isMonthlyTransaction.value) {
            const { monthFrom, monthTo } = transactionProperties.monthlyTransactionProperties;
            if (!monthFrom) {
                throw Error('`monthFrom` is empty');
            }

            if (
                monthTo &&
                new Date(monthTo.year, monthTo.month - 1) <=
                    new Date(monthFrom.year, monthFrom.month - 1)
            ) {
                throw Error('`monthTo` is before than `monthFrom`');
            }

            payload = {
                ...basePayload,
                monthFrom: dateToYearMonth(new Date(monthFrom.year, monthFrom.month - 1)),
                monthTo: monthTo
                    ? dateToYearMonth(new Date(monthTo.year, monthTo.month - 1))
                    : undefined
            };
        } else {
            let date: Date;
            const { today, customDate } = transactionProperties.oneoffTransactionProperties;
            if (today) {
                date = new Date();
            } else {
                date = new Date(customDate);
            }
            payload = {
                ...basePayload,
                date: date.toISOString().split('T')[0]
            };
        }

        if (props.transaction) {
            TransactionStore.update(
                isMonthlyTransaction.value ? 'monthly' : 'oneoff',
                props.transaction.id,
                payload
            )
                .then(() => {
                    eventEmitter.dispatchEvent(
                        new NotificationEvent(
                            NotificationStyle.SUCCESS,
                            'Transaktion erfolgreich bearbeitet'
                        )
                    );
                })
                .catch((err) => {
                    console.log(err);
                    eventEmitter.dispatchEvent(
                        new NotificationEvent(NotificationStyle.ERROR, 'Fehler bei der Bearbeitung')
                    );
                });
        } else {
            TransactionStore.create(isMonthlyTransaction.value ? 'monthly' : 'oneoff', payload)
                .then(() => {
                    eventEmitter.dispatchEvent(
                        new NotificationEvent(
                            NotificationStyle.SUCCESS,
                            'Transaktion erfolgreich erstellt'
                        )
                    );
                })
                .catch((err) => {
                    console.log(err);
                    eventEmitter.dispatchEvent(
                        new NotificationEvent(NotificationStyle.ERROR, 'Fehler bei der Erstellung')
                    );
                });
        }
        emit('done');
    } catch (err) {
        console.error(err);
        eventEmitter.dispatchEvent(
            new NotificationEvent(NotificationStyle.ERROR, 'Ungültiges Formular')
        );
    } finally {
        submitLocks.value.delete('submit');
    }
}
</script>

<template>
    <form class="flex flex-col gap-8" @submit.prevent="submit">
        <section>
            <h2>Es handelt sich um einen</h2>
            <div class="mx-4 flex flex-col">
                <label>
                    <input v-model="transactionProperties.isExpense" type="radio" :value="true" />
                    Geldausgang
                </label>
                <label>
                    <input v-model="transactionProperties.isExpense" type="radio" :value="false" />
                    Geldeingang
                </label>
                <label v-if="allowedTransactionType === 'any'" class="mt-4">
                    <input v-model="isMonthlyTransaction" type="checkbox" />
                    Monatlicher Umsatz
                </label>
            </div>
        </section>

        <section v-if="!isMonthlyTransaction">
            <h2>Datum</h2>
            <div class="mx-4">
                <label for="current-date-radio">
                    <input
                        id="current-date-radio"
                        v-model="transactionProperties.oneoffTransactionProperties.today"
                        type="radio"
                        :value="true"
                    />
                    Heute:
                    <time class="text-secondary">{{ formattedDate }}</time>
                </label>
                <br />
                <label for="manual-date-radio">
                    <input
                        id="manual-date-radio"
                        v-model="transactionProperties.oneoffTransactionProperties.today"
                        type="radio"
                        :value="false"
                    />
                    am
                    <TextInput
                        id="manual-date-input"
                        v-model="transactionProperties.oneoffTransactionProperties.customDate"
                        class="ml-1 inline-block"
                        type="date"
                        :required="!transactionProperties.oneoffTransactionProperties.today"
                        @click="transactionProperties.oneoffTransactionProperties.today = false"
                    />
                </label>
            </div>
        </section>

        <section v-else>
            <h2>Zeitraum</h2>
            <GridForm class="mx-4">
                <label for="transaction-first">Erster Umsatz</label>
                <MonthInput
                    id="transaction-first"
                    v-model="transactionProperties.monthlyTransactionProperties.monthFrom"
                    :required="true"
                />
                <label for="transaction-last">Letzter Umsatz</label>
                <MonthInput
                    id="transaction-last"
                    v-model="transactionProperties.monthlyTransactionProperties.monthTo"
                />
            </GridForm>
        </section>

        <section>
            <h2>Transaktion</h2>
            <GridForm class="mx-4">
                <label for="amount">Betrag</label>
                <CurrencyInput v-model="transactionProperties.amount" required />

                <label for="category">Kategorie</label>
                <AutoComplete
                    v-model="transactionProperties.Category"
                    :suggestions="CategoryShopStore.categories"
                    :required="true"
                    :suggest-create-object="true"
                    @request-create="(name) => createCategoryShop('Category', name)"
                />

                <label for="shop">Ort/Geschäft</label>
                <AutoComplete
                    v-model="transactionProperties.Shop"
                    :suggestions="CategoryShopStore.shops"
                    :suggest-create-object="true"
                    @request-create="(name) => createCategoryShop('Shop', name)"
                />

                <label for="description">Beschreibung</label>
                <TextInput v-model.lazy.trim="transactionProperties.description" type="text" />
            </GridForm>
        </section>

        <div class="flex justify-center gap-2">
            <button
                type="submit"
                class="btn btn-green grid child:col-start-1 child:col-end-2 child:row-start-1 child:row-end-2"
                :disabled="submitLocks.size > 0"
            >
                <LoadingSpinner v-show="submitLocks.size > 0" />
                <span v-show="submitLocks.size === 0">Speichern</span>
            </button>
            <button v-if="showCancelButton" type="button" class="btn" @click="emit('done')">
                Verwerfen
            </button>
        </div>
    </form>
</template>

<style scoped>
h2 {
    @apply text-xl;
}

section {
    text-align: left;
}

label > :is(input[type='checkbox'], input[type='radio']) {
    margin-right: 8px;
}
</style>
