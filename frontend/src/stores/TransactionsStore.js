import { defineStore } from 'pinia';

export const useTransactionsStore = defineStore('Transaction', {
    state: () => {
        return {
            transactions: {
                oneoff: {
                    expenses: [],
                    incomes: []
                },
                monthly: {
                    expenses: [],
                    incomes: []
                }
            }
        };
    },
    actions: {
        async fetch() {
            for (let frequency of ['oneoff', 'monthly']) {
                let response;
                try {
                    response = await fetch(`/api/transactions/${frequency}`);
                    if (!response.ok) {
                        // TODO fix
                        // this.$notificationBus.emit('notification', {
                        //     type: 'warning',
                        //     content: `Failed to load ${frequency} transactions`
                        // });
                        continue;
                    }
                    const body = await response.json();
                    const { expenses, incomes } = body.data.reduce(
                        (res, item) => {
                            res[item.Transaction.isExpense ? 'expenses' : 'incomes'].push(item);
                            return res;
                        },
                        { expenses: [], incomes: [] }
                    );
                    this.transactions[frequency]['expenses'] = expenses;
                    this.transactions[frequency]['incomes'] = incomes;
                } catch (error) {
                    console.error(error);
                    // TODO fix
                    // this.$notificationBus.emit('notification', { type: 'error', content: `error` });
                }
            }
        },
        async delete() {},
        async update() {}
    }
});
