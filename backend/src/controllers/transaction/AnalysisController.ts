import { Op } from 'sequelize';
import { QueryTypes } from 'sequelize';

import sequelize, { User } from '../../database/db.js';
import MonthlyTransaction from '../../database/models/MonthlyTransaction.js';
import { MonthlySummary } from '../../types/AnalysisTypes.js';

class AnalysisController {
    /**
     * Summarise all monthly / one-off expenses by month within the given year.
     * @param year
     * @returns
     */
    async getYearlyStatistics(user: User, year: number): Promise<MonthlySummary> {
        const promiseResults: [
            Promise<
                {
                    year: number;
                    month: number;
                    expenses: number;
                    incomes: number;
                }[]
            >,
            Promise<MonthlyTransaction[]>
        ] = [
            sequelize.query(
                `
            SELECT
                EXTRACT(YEAR FROM "OneoffTransactions"."date") as year,
                EXTRACT(month FROM "OneoffTransactions"."date") as month,
                SUM(CASE WHEN "Transactions"."isExpense" = true THEN "Transactions"."amount" else 0 END) as expenses,
                SUM(CASE WHEN "Transactions"."isExpense" = false THEN "Transactions"."amount" else 0 END) as incomes 
            FROM
                "OneoffTransactions", "Transactions"
            WHERE
                "Transactions"."id" = "OneoffTransactions"."TransactionId"
                AND EXTRACT(YEAR FROM "OneoffTransactions"."date") = :year
                AND "UserId" = :UserId
            GROUP BY
                year, month;
            `,
                {
                    replacements: {
                        year: year,
                        UserId: user.id
                    },
                    type: QueryTypes.SELECT
                }
            ),
            MonthlyTransaction.findAll({
                where: {
                    monthFrom: {
                        [Op.between]: [new Date(year, 0, 1), new Date(year, 11, 31)]
                    },
                    monthTo: {
                        [Op.or]: {
                            [Op.eq]: null,
                            [Op.between]: [new Date(year, 0, 1), new Date(year, 11, 31)]
                        }
                    }
                }
            })
        ];
        const queryResults = await Promise.all(promiseResults);
        const monthlyValues: MonthlySummary = Array.from({ length: 12 });
        for (let i = 0; i < 12; i++) {
            monthlyValues[i] = {
                oneoff: {
                    expenses: 0,
                    incomes: 0
                },
                monthly: {
                    expenses: 0,
                    incomes: 0
                },
                balance: 0
            };
        }
        for (let entry of queryResults[0]) {
            monthlyValues[entry.month - 1].oneoff.expenses = Number(entry.expenses);
            monthlyValues[entry.month - 1].oneoff.incomes = Number(entry.incomes);
        }

        // doing the same as with one-off transactions but with monthly transactions is a lot more difficult, so now we approach this in a simpler way
        for (let monthlyTransaction of queryResults[1]) {
            const month0 = new Date(monthlyTransaction.monthFrom).getMonth();
            const month1 = monthlyTransaction.monthTo ? new Date(monthlyTransaction.monthTo).getMonth() : 11;
            for (let monthData of monthlyValues) {
                if (monthlyTransaction.Transaction.isExpense) {
                    monthData.monthly.expenses += monthlyTransaction.Transaction.amount;
                } else {
                    monthData.monthly.incomes += monthlyTransaction.Transaction.amount;
                }
            }
        }

        // finally calculate the balance
        for (let month in monthlyValues) {
            monthlyValues[month].balance =
                monthlyValues[month].oneoff.incomes +
                monthlyValues[month].monthly.incomes -
                monthlyValues[month].oneoff.expenses -
                monthlyValues[month].monthly.expenses;
        }

        return monthlyValues;
    }
}

export default new AnalysisController();
