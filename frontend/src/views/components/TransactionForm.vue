<script>
import { mapStores } from 'pinia';
import { useCategoryShopStore } from '@/stores/CategoryShopStore';

import { format_currency } from '../../common';
import GridForm from './GridForm.vue';

const TANSACTION_FREQUENCY = {
    Default: 'default',
    OneoffTransaction: 'oneoff',
    MonthlyTransaction: 'monthly'
};

export default {
    data() {
        return {
            transactionFormTypes: TANSACTION_FREQUENCY,
            formattedDate: "",
            requestPending: false,
            form: {
                monthlyTransactionChecked: false,
                dateInputPreference: "today",
                manuallyEnteredDate: "",
                monthFrom: "",
                monthTo: ""
            },
            content: {
                isExpense: true,
                amount: 0,
                category: "",
                shop: "",
                description: ""
            }
        };
    },
    props: {
        showTypeSection: {
            type: Boolean,
            required: false,
            default() {
                return true;
            }
        },
        fixedFrequency: {
            type: String,
            required: false,
            default() {
                return TANSACTION_FREQUENCY.Default;
            },
            validator(value) {
                return Object.values(TANSACTION_FREQUENCY).includes(value);
            }
        },
        baseTransaction: {
            type: Object,
            required: false
        }
    },
    methods: {
        refreshDateTime() {
            const currentDate = new Date();
            this.formattedDate = currentDate.toLocaleDateString("de-DE", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            });
            const midnight = new Date();
            // sets to next day 0:00
            midnight.setHours(24, 0, 0, 0);
            const millisecondToNextDay = midnight - currentDate;
            setTimeout(this.refreshDateTime, millisecondToNextDay);
        },
        prepareAmountInput(evt) {
            if (!evt.target.value)
                return;
            evt.target.value = evt.target.value.replace(/[\s€]+/, "");
        },
        finishAmountInput(evt) {
            if (!evt.target.value)
                return;
            let input = evt.target.value;
            if (!input.match(/^[^\.,\d]*\d*\.\d+[^\.,\d]*$/)) {
                // assume the use of a comma as decimal separator instead of a point
                input = input.replace(".", "").replace(",", ".");
            }
            const raw_input = Number(input.replace(/[^0-9.]+/, ""));
            const sanitizedNumber = Math.max(1, Math.round(100 * raw_input));
            this.content.amount = sanitizedNumber;
            evt.target.value = format_currency(sanitizedNumber);
        },
        async submit() {
            this.requestPending = true;
            const httpMethod = this.baseTransaction ? "PATCH" : "POST";
            let endpoint;
            let notificationPayload;
            const payload = JSON.parse(JSON.stringify(this.content));
            console.log(payload);
            // The following keys are supposed to be excluded if not provided by the user
            // the same applies for `monthTo`, though empty values for this key are handled later
            for (let key of ["shop", "description"]) {
                if (payload[key] === "") {
                    delete payload[key];
                }
            }
            if (this.computedIsMonthlyTransaction) {
                payload.monthFrom = this.form.monthFrom;
                if (this.form.monthTo) {
                    payload.monthTo = this.form.monthTo;
                }
                endpoint = "/api/transactions/monthly";
            }
            else {
                if (this.form.dateInputPreference === "today") {
                    payload.date = new Date().toISOString().split("T")[0];
                }
                else {
                    payload.date = this.form.manuallyEnteredDate;
                }
                endpoint = "/api/transactions/oneoff";
            }
            if (httpMethod === "PATCH") {
                endpoint = endpoint.concat("/", this.baseTransaction.id);
            }
            try {
                const response = await fetch(endpoint, {
                    method: httpMethod,
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });
                const body = await response.json();
                // TODO: take body status into account
                notificationPayload = {
                    content: `${response.status} ${response.statusText}`,
                    type: response.ok ? "success" : "error"
                };
                if (response.ok) {
                    this.$emit("done", body.data);
                }
            }
            catch (e) {
                console.log(e);
                notificationPayload = { type: "error", content: e };
            }
            this.requestPending = false;
            this.$notificationBus.emit("notification", notificationPayload);
        }
    },
    computed: {
        computedIsMonthlyTransaction() {
            if (this.fixedFrequency === TANSACTION_FREQUENCY.Default) {
                return this.form.monthlyTransactionChecked;
            }
            return this.fixedFrequency === TANSACTION_FREQUENCY.MonthlyTransaction;
        },
        ...mapStores(useCategoryShopStore)
    },
    mounted() {
        this.refreshDateTime();
        if (this.baseTransaction) {
            // Load base transaction data into this form
            if (this.fixedFrequency === "monthly") {
                this.form.monthlyTransactionChecked = true;
                this.form.monthFrom = this.baseTransaction.monthFrom;
                this.form.monthTo = this.baseTransaction.monthTo || "";
            }
            else {
                this.form.monthlyTransactionChecked = false;
                this.form.dateInputPreference = "custom";
                this.form.manuallyEnteredDate = this.baseTransaction.date;
            }
            const { isExpense, amount, Category, Shop, description } = this.baseTransaction.Transaction;
            this.content.isExpense = isExpense;
            this.content.amount = amount;
            this.content.category = Category.name;
            this.content.shop = Shop ? Shop.name : "";
            this.content.description = description || "";
            this.$refs.amountInput.value = format_currency(this.content.amount);
        }
    },
    emits: ["done"],
    components: { GridForm }
};
</script>

<template>
    <form @submit.prevent="submit">
        <section class="my-4" v-if="showTypeSection">
            <h2>Es handelt sich um einen</h2>
            <div class="mx-4">
                <label for="transaction-type-expense">
                    <input type="radio" id="transaction-type-expense" v-model="content.isExpense" value="true" />
                    Geldausgang
                </label>
                <br>
                <label for="transaction-type-income">
                    <input type="radio" id="transaction-type-income" v-model="content.isExpense" value="false" />
                    Geldeingang
                </label>
                <br class="mb-2">
                <label for="transaction-repeating" v-if="fixedFrequency === transactionFormTypes.Default">
                    <input type="checkbox" id="transaction-repeating" v-model="form.monthlyTransactionChecked" />
                    Monatlicher Umsatz
                </label>
                <br>
            </div>
        </section>

        <section v-if="!computedIsMonthlyTransaction" class="my-4">
            <h2>Datum</h2>
            <div class="mx-4">
                <label for="current-date-radio">
                    <input type="radio" id="current-date-radio" v-model="form.dateInputPreference" value="today" />
                    Heute:
                    <time class="text-secondary dark:text-secondary-dark">{{ formattedDate }}</time>
                </label>
                <br>
                <label for="manual-date-radio">
                    <input type="radio" id="manual-date-radio" v-model="form.dateInputPreference" value="custom" />
                    am
                    <input type="date" id="manual-date-input" v-model="form.manuallyEnteredDate"
                        :required="form.dateInputPreference === 'custom'"
                        @click="form.dateInputPreference = 'custom'" />
                </label>
            </div>
        </section>

        <section v-else class="my-4">
            <h2>Zeitraum</h2>
            <GridForm class="mx-4">
                <label for="transaction-first">Erster Umsatz</label>
                <input type="date" id="transaction-first" v-model="form.monthFrom" required="true" />
                <label for="transaction-last">Letzter Umsatz</label>
                <input type="date" id="transaction-last" v-model="form.monthTo" />
            </GridForm>
        </section>

        <section class="my-4">
            <h2>Transaktion</h2>
            <GridForm class="mx-4">
                <label for="amount">Betrag</label>
                <input type="text" id="amount" placeholder="0,00 €" required @focus="prepareAmountInput"
                    @focusout="finishAmountInput" ref="amountInput" />

                <label for="category">Kategorie</label>
                <input type="text" id="category" v-model.lazy.trim="content.category" list="category-suggestions"
                    required />

                <label for="shop">Ort/Geschäft</label>
                <input type="text" id="shop" v-model.lazy.trim="content.shop" list="shop-suggestions" />

                <label for="description">Beschreibung</label>
                <input type="text" id="description" v-model.lazy.trim="content.description" />

                <datalist id="shop-suggestions">
                    <option v-for="name in CategoryShopStore.shopNames" :value="name"></option>
                </datalist>
                <datalist id="category-suggestions">
                    <option v-for="name in CategoryShopStore.categoryNames" :value="name"></option>
                </datalist>
            </GridForm>
        </section>

        <div class="flex justify-center">
            <button type="submit" class="btn" :disabled="requestPending">Speichern</button>
        </div>
    </form>
</template>

<style scoped lang="less">
h2 {
    @apply text-xl;
}
</style>
