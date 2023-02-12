<script>
import TransactionList from './components/TransactionList.vue';

export default {
    data() {
        return {
            transactions: {
                oneoff: {
                    all: [],
                    expense: [],
                    income: []
                },
                monthly: {
                    all: [],
                    expense: [],
                    income: []
                }
            }
        };
    },
    components: {
        TransactionList
    },
    methods: {
        async update() {
            for (let frequency of ['oneoff', 'monthly']) {
                let response;
                try {
                    response = await fetch(`/api/transactions/${frequency}`);
                    if (!response.ok) {
                        this.$notificationBus.emit('notification', { type: 'warning', content: `Failed to load ${frequency} transactions` });
                        continue;
                    }
                    const body = await response.json();
                    this.transactions[frequency]['expense'] = body.data.filter(t => t.Transaction.isExpense);
                    this.transactions[frequency]['income'] = body.data.filter(t => !t.Transaction.isExpense);
                } catch (error) {
                    console.error(error);
                    this.$notificationBus.emit('notification', { type: 'error', content: `error` });
                }
            }
        },
        async deleteTransactionLocally(id, frequency, type) {
            this.transactions[frequency][type] = this.transactions[frequency][type].filter(t => t.id !== id);
        },
        async updateSelectedTransaction(id, result, frequency, type) {
            for (let i in this.transactions[frequency][type]) {
                if (this.transactions[frequency][type][i].id === id) {
                    this.transactions[frequency][type][i] = result;
                    /*
                    const response = await fetch(`/api/transactions/${frequency}/${id}`);
                    const body = await response.json();
                    this.transactions[frequency][type][i] = body.data;
                    */
                    return;
                }
            }
        }
    },
    mounted() {
        this.update();
    }
};
</script>

<template>
    <button @click="update" class="centre" style="font-size: 2rem;"><span class="material-symbols-outlined">refresh</span></button>
    <h1>Liste: einmalige Transaktionen</h1>
    <h2>Ausgaben</h2>
    <TransactionList frequency="oneoff" :transactions="transactions['oneoff']['expense']"
        @update="(id, result) => updateSelectedTransaction(id, result, 'oneoff', 'expense')"
        @delete="(id) => deleteTransactionLocally(id, 'oneoff', 'expense')"
    ></TransactionList>
    <h2>Einkommen</h2>
    <TransactionList frequency="oneoff" :transactions="transactions['oneoff']['income']"
        @update="(id, result) => updateSelectedTransaction(id, result, 'oneoff', 'income')"
        @delete="(id) => deleteTransactionLocally(id, 'oneoff', 'income')"
    ></TransactionList>

    <h1>Liste: monatliche Transaktionen</h1>
    <h2>Ausgaben</h2>
    <TransactionList frequency="monthly" :transactions="transactions['monthly']['expense']"
        @update="(id, result) => updateSelectedTransaction(id, result, 'monthly', 'expense')"
        @delete="(id) => deleteTransactionLocally(id, 'monthly', 'expense')"
    ></TransactionList>
    <h2>Einkommen</h2>
    <TransactionList frequency="monthly" :transactions="transactions['monthly']['income']"
        @update="(id, result) => updateSelectedTransaction(id, result, 'monthly', 'income')"
        @delete="(id) => deleteTransactionLocally(id, 'monthly', 'income')"
    ></TransactionList>
</template>
