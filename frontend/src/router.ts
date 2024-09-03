import { createRouter, createWebHistory } from 'vue-router';

import AccountPage from '@/components/pages/AccountPage.vue';
import IndexPage from '@/components/pages/IndexPage.vue';
import ListPage from '@/components/pages/ListPage.vue';
import MonthAnalysisPage from '@/components/pages/MonthAnalysisPage.vue';
import TransactionForm from '@/components/pages/TransactionFormPage.vue';
import YearAnalysisPage from '@/components/pages/YearAnalysisPage.vue';

const routes = [
    {
        path: '/',
        component: IndexPage
    },
    {
        path: '/new',
        component: TransactionForm
    },
    {
        path: '/list',
        component: ListPage,
        meta: {
            fillWidth: true
        }
    },
    {
        path: '/account',
        component: AccountPage
    },
    {
        path: '/analysis/',
        component: MonthAnalysisPage,
        meta: {
            fillWidth: true
        }
    },
    {
        path: '/analysis/:year',
        component: YearAnalysisPage,
        meta: {
            fillWidth: true
        }
    },
    {
        path: '/analysis/:year/:month',
        component: MonthAnalysisPage,
        meta: {
            fillWidth: true
        }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes: routes
});

export default router;
