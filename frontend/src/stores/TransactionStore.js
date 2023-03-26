import { defineStore } from 'pinia';

import HttpError from '@/HttpError';

function orderByTimeString(timeA, timeB) {
    const timestampA = new Date(timeA).getTime();
    const timestampB = new Date(timeB).getTime();
    if (timestampA != timestampB) {
        return timestampA - timestampB;
    }
}

const orderOnoffTransactions = function (a, b) {
    if (a.date !== b.date) {
        return orderByTimeString(a.date, b.date);
    }

    return a.id - b.id;
};

const orderMonthlyTransactions = function (a, b) {
    if (a.monthFrom !== b.monthFrom) {
        return orderByTimeString(a.date, b.date);
    }

    const oneMonthToValueUndefined = !a.monthTo || !b.monthTo;
    if (oneMonthToValueUndefined) {
        // if `monthTo` is undefined, return a positive value to order monthly transactions without ending first.
        const atLeastOneMonthToValueUndefined = a.monthTo || b.monthTo;
        if (atLeastOneMonthToValueUndefined) {
            if (b.monthTo) {
                return 1;
            }

            return -1;
        }
    }

    if (a.monthTo !== b.monthTo) {
        return orderByTimeString(a.monthTo, b.monthTo);
    }

    // at this point, the monthTo values are either identical or both null
    return a.id - b.id;
};

export const useTransactionStore = defineStore('Transaction', {
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
    getters: {
        ordered: (state) => {
            return {
                oneoff: [
                    ...Object.values(state.transactions.oneoff.expenses),
                    ...Object.values(state.transactions.oneoff.incomes)
                ].sort(orderOnoffTransactions),
                monthly: [
                    ...Object.values(state.transactions.monthly.expenses),
                    ...Object.values(state.transactions.monthly.incomes)
                ].sort(orderMonthlyTransactions)
            };
        }
    },
    actions: {
        async create(frequency, payload) {
            const response = await fetch(`/api/transactions/${frequency}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
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
        async update(frequency, id, payload) {
            const response = await fetch(`/api/transactions/${frequency}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
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
        async delete(frequency, id) {
            const endpoint = `/api/transactions/${frequency}/${id}`;
            const response = await fetch(endpoint, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new HttpError(response.status);
            }
            if (this.transactions[frequency]['expenses'][id]) {
                delete this.transactions[frequency]['expenses'][id];
            } else if (this.transactions[frequency]['incomes'][id]) {
                delete this.transactions[frequency]['incomes'][id];
            }
        },
        getOrdered() {
            return {
                oneoff: {
                    expenses: Object.values(this.transactions.oneoff.expenses).sort(orderOnoffTransactions),
                    incomes: Object.values(this.transactions.oneoff.incomes).sort(orderOnoffTransactions)
                },
                monthly: {
                    expenses: Object.values(this.transactions.monthly.expenses).sort(orderMonthlyTransactions),
                    incomes: Object.values(this.transactions.monthly.incomes).sort(orderMonthlyTransactions)
                }
            };
        }
    }
});
