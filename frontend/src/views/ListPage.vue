<script setup>
import TransactionList from './components/TransactionList.vue';
import { useTransactionsStore } from '@/stores/TransactionsStore';

const TransactionStore = useTransactionsStore();
</script>

<template>
    <header class="flex flex-row items-center justify-between">
        <h1>Liste</h1>
        <button @click="TransactionStore.fetch" class="flex items-center"><span class="material-symbols-outlined text-3xl">refresh</span></button>
    </header>
    
    <h2 class="text-xl">Ausgaben (einmalig)</h2>
    <TransactionList frequency="oneoff" type="expenses"></TransactionList>
    
    <h2 class="text-xl">Einkommen (einmalig)</h2>
    <TransactionList frequency="oneoff" type="incomes"></TransactionList>

    <h2 class="text-xl">Ausgaben (mtl.)</h2>
    <TransactionList frequency="monthly" type="expenses"></TransactionList>
    
    <h2 class="text-xl">Einkommen (mtl.)</h2>
    <TransactionList frequency="monthly" type="incomes"></TransactionList>
</template>
