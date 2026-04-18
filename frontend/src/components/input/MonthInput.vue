<script setup lang="ts">
import DatePicker from 'primevue/datepicker';
import { computed } from 'vue';

const model = defineModel<string>();

const dateModel = computed({
    get() {
        if (!model.value) return null;
        const [year, month] = model.value.split('-');
        return new Date(Number(year), Number(month) - 1);
    },
    set(value: Date | null) {
        if (!value) {
            model.value = undefined;
            return;
        }
        model.value = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
    }
});
</script>

<template>
    <DatePicker v-model="dateModel" view="month" dateFormat="MM yy" showIcon fluid />
</template>
