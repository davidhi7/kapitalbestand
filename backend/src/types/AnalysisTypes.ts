export type MonthlySummary = Array<{
    oneoff: {
        expenses: number;
        incomes: number;
    };
    monthly: {
        expenses: number;
        incomes: number;
    };
}>;
