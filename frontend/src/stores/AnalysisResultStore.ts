import { defineStore } from 'pinia';

import type { MonthlySummary } from '@backend-types/AnalysisTypes';

type AnalysisReportState = {
    byYear: {
        [year: number]: MonthlySummary
    }
};

export const useAnalysisResultStore = defineStore('AnalysisResult', {
    state: (): AnalysisReportState => {
        return {
            byYear: {}
        };
    },
    actions: {
        async getYearlyReport(year: number): Promise<MonthlySummary | null> {
            if (this.byYear[year]) {
                return this.byYear[year]
            }

            const response = await fetch(`/api/analysis/year/${year}`);
            if (response.status >= 400) {
                // TOOD error
                return null;
            } else {
                const body = await response.json();
                const report: MonthlySummary = body.data;
                this.byYear[year] = report;
                return report;
            }
        },
    }
});
