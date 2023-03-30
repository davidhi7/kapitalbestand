import { createRouter, createWebHistory } from 'vue-router';

import AccountPage from './pages/AccountPage.vue';
import Index from './pages/Index.vue';
import List from './pages/list/ListPage.vue';
import MonthAnalysisPage from './pages/analysis/MonthAnalysisPage.vue';
import TransactionForm from './pages/transaction-form/TransactionFormPage.vue';
import YearAnalysisPage from './pages/analysis/YearAnalysisPage.vue';

const routes = [
    {
        path: '/',
        component: Index
    },
    {
        path: '/new',
        component: TransactionForm
    },
    {
        path: '/list',
        component: List
    },
    {
        path: '/account',
        component: AccountPage
    },
    {
        path: '/analysis/',
        component: MonthAnalysisPage,
        meta: {
            fullWidth: true   
        }
    },
    {
        path: '/analysis/:year',
        component: YearAnalysisPage,
        meta: {
            fullWidth: true   
        }
    },
    {
        path: '/analysis/:year/:month',
        component: MonthAnalysisPage,
        meta: {
            fullWidth: true   
        }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes: routes
});

export default router;
