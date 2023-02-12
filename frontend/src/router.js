import { createRouter, createWebHistory } from 'vue-router';

import Index from './views/Index.vue';
import NotificationTest from './views/NotificationTest.vue';
import TransactionForm from './views/TransactionFormPage.vue';
import List from './views/ListPage.vue'
import AccountPage from './views/AccountPage.vue';

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
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes: routes
});

export default router;
