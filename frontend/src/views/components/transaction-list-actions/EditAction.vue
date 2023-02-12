<script>
import TransactionForm from '../TransactionForm.vue'

export default {
    props: {
        transaction: {
            type: Object,
            required: true
        }
    },
    components: {
        TransactionForm
    },
    inject: ['frequency'],
    emits: ['done']
};
</script>

<template>
    <TransactionForm
        :showTypeSection="false"
        :fixedFrequency="frequency"
        :baseTransaction="transaction"
        @done="data => $emit('done', transaction.id, true, data)"    
    ></TransactionForm>
</template>

<style scoped>
form {
    display: grid;
    grid-template-columns: 100%;
    justify-items: center;
}
</style>
