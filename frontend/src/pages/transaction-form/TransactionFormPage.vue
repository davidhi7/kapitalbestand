<script>
import TransactionForm from './TransactionForm.vue';

export default {
    components: {
        TransactionForm
    },
    data() {
        return {
            type: 'Default'
        };
    },
    methods: {
        setType(type) {
            this.type = type;
        }
    }
};
</script>

<template>
    <h1 class="mb-4">Neue Transaktion</h1>
    <TransactionForm :fixed-transaction-form-type="type" />
</template>
