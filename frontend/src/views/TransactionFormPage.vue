<script>
import TransactionForm from './components/TransactionForm.vue';

export default {
    data() {
        return {
            type: 'Default'
        }
    },
    methods: {
        setType(type) {
            this.type = type;
        }
    },
    components: {
        TransactionForm
    }
}
</script>

<template>
    <h1>Neue Transaktion</h1>
    <TransactionForm :fixed-transaction-form-type="type"/>
</template>
