import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { Vue3Mq } from 'vue3-mq';

import '@/assets/base.less';
import '@/assets/icons.less';
import router from '@/router';
import { useAuthStateStore } from '@/stores/AuthStateStore';
import { useCategoryShopStore } from '@/stores/CategoryShopStore';
import App from '@/views/App.vue';
import { eventEmitter } from '@/views/components/Notification.vue';

import { useTransactionsStore } from './stores/TransactionsStore';

const app = createApp(App);
const pinia = createPinia();

app.use(router);
app.use(pinia);
app.use(Vue3Mq, {
    preset: 'tailwind'
});

const AuthStateStore = useAuthStateStore();
const CategoryShopStore = useCategoryShopStore();
const TransactionsStore = useTransactionsStore();

AuthStateStore.requestWhoAmI().then(() => {
    app.mount('div#app');
    if (AuthStateStore.authenticated) {
        CategoryShopStore.fetch();
        TransactionsStore.fetch();
    }
});

app.config.globalProperties.$notificationBus = eventEmitter;
