import { Op } from 'sequelize';
import { QueryTypes } from 'sequelize';

import sequelize from '../../database/db.js';
import MonthlyTransaction from '../../database/models/MonthlyTransaction.js';

type MonthlySummary = Array<{
    oneoff: {
        expenses: number;
        incomes: number;
    };
    monthly: {
        expenses: number;
        incomes: number;
    };
}>;

class AnalysisController {
    /**
     * Summarise all monthly / one-off expenses by month within the given year.
     * @param year
     * @returns
     */
    async getYearlyStatistics(year: number): Promise<MonthlySummary> {
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
                }
            };
        }
        const oneoffTransactionsSummary: Array<{
            year: number;
            month: number;
            expenses: number;
            incomes: number;
        }> = await sequelize.query(
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
            AND
            EXTRACT(YEAR FROM "OneoffTransactions"."date") = :year
        GROUP BY
            year, month;
        `,
            {
                replacements: {
                    year
                },
                type: QueryTypes.SELECT
            }
        );
        for (let entry of oneoffTransactionsSummary) {
            monthlyValues[entry.month - 1].oneoff.expenses = Number(entry.expenses);
            monthlyValues[entry.month - 1].oneoff.incomes = Number(entry.incomes);
        }

        // doing the same as with one-off transactions but with monthly transactions is a lot more difficult, so now we approach this in a simpler way
        const matchingMonthlyTransactions = await MonthlyTransaction.findAll({
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
        });
        for (let monthlyTransaction of matchingMonthlyTransactions) {
            const month0 = new Date(monthlyTransaction.monthFrom).getMonth();
            const month1 = monthlyTransaction.monthTo ? new Date(monthlyTransaction.monthTo).getMonth() : 11;
            for (let i = month0; i <= month1; i++) {
                if (monthlyTransaction.Transaction.isExpense) {
                    monthlyValues[i].monthly.expenses += monthlyTransaction.Transaction.amount;
                } else {
                    monthlyValues[i].monthly.incomes += monthlyTransaction.Transaction.amount;
                }
            }
        }

        return monthlyValues;
    }
}

export default new AnalysisController();
