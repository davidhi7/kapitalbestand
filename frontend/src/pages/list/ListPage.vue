<script setup>
import TransactionList from './TransactionList.vue';
import { useTransactionStore } from '@/stores/TransactionStore';

const TransactionStore = useTransactionStore();
</script>

<template>
    <header class="flex flex-row items-center justify-between">
        <h1>Liste</h1>
        <button @click="TransactionStore.fetch" class="btn flex items-center"><span class="material-symbols-outlined text-3xl">refresh</span></button>
    </header>
    
    <h2 class="text-xl mt-4">einmalig</h2>
    <TransactionList frequency="oneoff"></TransactionList>

    <h2 class="text-xl mt-4">monatlich</h2>
    <TransactionList frequency="monthly"></TransactionList>
</template>
