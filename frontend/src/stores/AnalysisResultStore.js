import { defineStore } from 'pinia';

export const useAnalysisResultStore = defineStore('AnalysisResult', {
    state: () => {
        return {
            years: {}
        };
    },
    actions: {
        async fetchYearAnalysis(year) {
            const response = await fetch(`/api/analysis/year/${year}`);
            if (response.status >= 400) {
                // TODO error
            } else {
                const body = await response.json();
                this.years[year] = body.data;
            }
        }
    }
});
