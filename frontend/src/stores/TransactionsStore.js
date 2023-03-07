import { defineStore } from 'pinia';

import HttpError from '@/HttpError';

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
                        throw new HttpError(response.status);
                    }
                    const body = await response.json();
                    // filter expenses and incomes from all responses
                    const { expenses, incomes } = body.data.reduce(
                        (res, item) => {
                            res[item.Transaction.isExpense ? 'expenses' : 'incomes'][item.id] = item;
                            return res;
                        },
                        { expenses: [], incomes: [] }
                    );
                    this.transactions[frequency]['expenses'] = expenses;
                    this.transactions[frequency]['incomes'] = incomes;
                } catch (error) {
                    console.error(error);
                    throw error;
                }
            }
        },
        async delete(frequency, id) {
            const endpoint = `/api/transactions/${frequency}/${id}`;
            const response = await fetch(endpoint, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new HttpError(response.status)
            }
            if (this.transactions[frequency]['expenses'][id]) {
                delete this.transactions[frequency]['expenses'][id];
            } else if (this.transactions[frequency]['incomes'][id]) {
                delete this.transactions[frequency]['incomes'][id];
            }
        },
        async update(frequency, id, payload) {
            const response = await fetch(`/api/transactions/${frequency}/${id}`, {
                method: 'PATCH',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new HttpError(response.status);
            }
            const body = await response.json();

            const transaction_type = body.data.Transaction.isExpense === true ? 'expenses' : 'incomes';
            this.transactions[frequency][transaction_type][body.data.id] = body.data;
        },
        async create(frequency, payload) {
            const response = await fetch(`/api/transactions/${frequency}`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new HttpError(response.status);
            }
            const body = await response.json();

            const transaction_type = body.data.Transaction.isExpense === true ? 'expenses' : 'incomes';
            this.transactions[frequency][transaction_type][body.data.id] = body.data;
        }
    }
});
