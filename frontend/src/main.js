import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { Vue3Mq } from 'vue3-mq';

import '@/assets/base.less';
import '@/assets/icons.less';
import App from '@/pages/base/App.vue';
import { eventEmitter } from '@/pages/base/Notification.vue';
import router from '@/router';
import { authEventTarget, useAuthStateStore } from '@/stores/AuthStateStore';
import { useCategoryShopStore } from '@/stores/CategoryShopStore';

import { useTransactionStore } from './stores/TransactionStore';

const app = createApp(App);
const pinia = createPinia();

app.use(router);
app.use(pinia);
app.use(Vue3Mq, {
    preset: 'tailwind'
});

const AuthStateStore = useAuthStateStore();
const CategoryShopStore = useCategoryShopStore();
const TransactionStore = useTransactionStore();

authEventTarget.addEventListener('authentication', () => {
    CategoryShopStore.fetch();
    TransactionStore.fetch();
});

await AuthStateStore.requestWhoAmI().then(() => {
    app.mount('div#app');
});

app.config.globalProperties.$notificationBus = eventEmitter;
