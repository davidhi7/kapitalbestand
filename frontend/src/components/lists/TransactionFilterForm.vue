<script setup lang="ts">
import Button from 'primevue/button';
import DatePicker from 'primevue/datepicker';
import FieldSet from 'primevue/fieldset';
import FloatLabel from 'primevue/floatlabel';
import InputNumber from 'primevue/inputnumber';
import RadioButton from 'primevue/radiobutton';
import RadioButtonGroup from 'primevue/radiobuttongroup';

import AutoComplete from '@/components/AutoComplete.vue';
import { TransactionFilterRules } from '@/components/pages/ListPage.vue';
import { useCategoryShopStore } from '@/stores/CategoryShopStore';

const CategoryShopStore = useCategoryShopStore();

const emit = defineEmits<{
    submit: [];
    reset: [];
}>();

const form = defineModel<TransactionFilterRules>({
    default: {}
});

function setLastDays(days: number) {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    form.value = {
        type: 'all',
        recurrence: 'all',
        dateFrom,
        dateTo: undefined
    };
}

function setAllRecurring() {
    const today = new Date();
    form.value = {
        type: 'all',
        recurrence: 'recurring',
        dateFrom: today,
        dateTo: today
    };
}

function setAll() {
    form.value = {
        type: 'all',
        recurrence: 'all',
        dateFrom: undefined,
        dateTo: undefined
    };
}
</script>

<template>
    <form
        class="mx-4 flex min-h-0 flex-col gap-2 self-end py-2"
        @submit.prevent="emit('submit')"
    >
        <FieldSet legend="Typ">
            <RadioButtonGroup v-model="form.type" class="flex flex-col gap-1">
                <label class="flex items-center gap-2">
                    <RadioButton value="all" />
                    Alle Transaktionen
                </label>
                <label class="flex items-center gap-2">
                    <RadioButton value="expense" />
                    Nur Geldausgänge
                </label>
                <label class="flex items-center gap-2">
                    <RadioButton value="income" />
                    Nur Geldeingänge
                </label>
            </RadioButtonGroup>
        </FieldSet>

        <FieldSet legend="Häufigkeit">
            <div class="flex flex-col gap-2">
                <RadioButtonGroup
                    v-model="form.recurrence"
                    class="flex flex-col gap-1"
                >
                    <label class="flex items-center gap-2">
                        <RadioButton value="all" />
                        Alle Transaktionen
                    </label>
                    <label class="flex items-center gap-2">
                        <RadioButton value="oneoff" />
                        Nur einmalige Transaktionen
                    </label>
                    <label class="flex items-center gap-2">
                        <RadioButton value="recurring" />
                        Nur wiederkehrende Transaktionen
                    </label>
                </RadioButtonGroup>
                <div class="mt-4 flex flex-col gap-2">
                    <FloatLabel variant="on" class="flex-1">
                        <DatePicker
                            v-model="form.dateFrom"
                            input-id="dateFrom"
                            date-format="dd.mm.yy"
                            show-button-bar
                            show-clear
                            fluid
                        />
                        <label for="dateFrom">Frühester Zeitpunkt</label>
                    </FloatLabel>
                    <FloatLabel variant="on" class="flex-1">
                        <DatePicker
                            v-model="form.dateTo"
                            input-id="dateTo"
                            date-format="dd.mm.yy"
                            show-button-bar
                            show-clear
                            fluid
                        />
                        <label for="dateTo">Spätester Zeitpunkt</label>
                    </FloatLabel>
                </div>
                <div class="flex flex-wrap gap-2">
                    <Button
                        label="Letzten 30 Tage"
                        severity="secondary"
                        rounded
                        size="small"
                        type="button"
                        @click="setLastDays(30)"
                    ></Button>
                    <Button
                        label="Letzten 90 Tage"
                        severity="secondary"
                        rounded
                        size="small"
                        type="button"
                        @click="setLastDays(90)"
                    ></Button>
                    <Button
                        label="Aktive wiederkehrende Transaktionen"
                        severity="secondary"
                        rounded
                        size="small"
                        type="button"
                        @click="setAllRecurring"
                    ></Button>
                    <Button
                        label="Alles"
                        severity="secondary"
                        rounded
                        size="small"
                        type="button"
                        @click="setAll"
                    ></Button>
                </div>
            </div>
        </FieldSet>

        <FieldSet legend="Transaktion">
            <div class="flex flex-col gap-2">
                <FloatLabel variant="on">
                    <InputNumber
                        v-model="form.amountFrom"
                        input-id="amountFrom"
                        mode="currency"
                        currency="EUR"
                        locale="de-DE"
                        fluid
                    />
                    <label for="amountFrom">Ab Betrag</label>
                </FloatLabel>
                <FloatLabel variant="on">
                    <InputNumber
                        v-model="form.amountTo"
                        input-id="amountTo"
                        mode="currency"
                        currency="EUR"
                        locale="de-DE"
                        fluid
                    />
                    <label for="amountTo">Bis Betrag</label>
                </FloatLabel>
                <FloatLabel variant="on">
                    <AutoComplete
                        v-model="form.category"
                        input-id="category"
                        :suggestions="Object.keys(CategoryShopStore.categories)"
                        show-clear
                    />
                    <label for="category">Kategorie</label>
                </FloatLabel>

                <FloatLabel variant="on">
                    <AutoComplete
                        v-model="form.shop"
                        input-id="shop"
                        :suggestions="Object.keys(CategoryShopStore.shops)"
                        show-clear
                    />
                    <label for="shop">Händler</label>
                </FloatLabel>
            </div>
        </FieldSet>

        <div class="flex justify-center gap-2">
            <Button label="Suchen" type="submit" severity="success" />
            <Button
                label="Zurücksetzen"
                type="button"
                severity="secondary"
                @click="emit('reset')"
            />
        </div>
    </form>
</template>
