import { createRouter, createWebHistory } from 'vue-router';

import AccountPage from '@/components/pages/AccountPage.vue';
import IndexPage from '@/components/pages/IndexPage.vue';
import ListPage from '@/components/pages/ListPage.vue';
import TransactionForm from '@/components/pages/TransactionFormPage.vue';

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
    }
    // TODO bring back
    // {
    //     path: '/analysis/',
    //     component: MonthAnalysisPage,
    //     meta: {
    //         fillWidth: true
    //     }
    // },
    // {
    //     path: '/analysis/:year',
    //     component: YearAnalysisPage,
    //     meta: {
    //         fillWidth: true
    //     }
    // },
    // {
    //     path: '/analysis/:year/:month',
    //     component: MonthAnalysisPage,
    //     meta: {
    //         fillWidth: true
    //     }
    // }
];

const router = createRouter({
    history: createWebHistory(),
    routes: routes
});

export default router;
