<script setup>
import { useTransactionStore } from '@/stores/TransactionStore';

import TransactionList from './TransactionList.vue';

const TransactionStore = useTransactionStore();
</script>

<template>
    <header class="flex flex-row items-center justify-between">
        <h1>Liste</h1>
        <button class="btn flex items-center" @click="TransactionStore.fetch">
            <span class="material-symbols-outlined text-3xl">refresh</span>
        </button>
    </header>

    <h2 class="mt-4 text-xl">einmalig</h2>
    <TransactionList frequency="oneoff" />

    <h2 class="mt-4 text-xl">monatlich</h2>
    <TransactionList frequency="monthly" />
</template>
