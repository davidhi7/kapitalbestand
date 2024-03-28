<script>
import TransactionForm from '@/components/forms/TransactionForm.vue';

export default {
    components: {
        TransactionForm
    },
    inject: ['frequency'],
    props: {
        transaction: {
            type: Object,
            required: true
        }
    },
    emits: ['done']
};
</script>

<template>
    <TransactionForm :transaction="transaction" @done="(data) => $emit('done')" />
</template>

<style scoped>
form {
    display: grid;
    grid-template-columns: 100%;
    justify-items: center;
}
</style>
