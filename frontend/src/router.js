import { createRouter, createWebHistory } from 'vue-router';

import AccountPage from './views/AccountPage.vue';
import Index from './views/Index.vue';
import List from './views/list-page/ListPage.vue';
import MonthAnalysisPage from './views/analysis-page/MonthAnalysisPage.vue';
import NotificationTest from './views/NotificationTest.vue';
import TransactionForm from './views/transaction-form-page/TransactionFormPage.vue';
import YearAnalysisPage from './views/analysis-page/YearAnalysisPage.vue';

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
        path: '/test',
        component: NotificationTest
    },
    {
        path: '/account',
        component: AccountPage
    },
    {
        path: '/analysis/',
        component: MonthAnalysisPage
    },
    {
        path: '/analysis/:year',
        component: YearAnalysisPage
    },
    {
        path: '/analysis/:year/:month',
        component: MonthAnalysisPage
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes: routes
});

export default router;
