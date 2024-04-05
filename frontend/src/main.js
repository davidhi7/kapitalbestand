import { createPinia } from 'pinia';
import { createApp } from 'vue';

import '@/assets/base.css';
import '@/assets/icons.css';
import App from '@/components/App.vue';
import router from '@/router';
import { authEventTarget, useAuthStateStore } from '@/stores/AuthStateStore';
import { useCategoryShopStore } from '@/stores/CategoryShopStore';
import { useTransactionStore } from '@/stores/TransactionStore';

const app = createApp(App);
const pinia = createPinia();

app.use(router);
app.use(pinia);

const AuthStateStore = useAuthStateStore();
const CategoryShopStore = useCategoryShopStore();
const TransactionStore = useTransactionStore();

authEventTarget.addEventListener('authentication', () => {
    CategoryShopStore.fetch();
    TransactionStore.fetch();
});

AuthStateStore.requestWhoAmI().then(() => {
    app.mount('div#app');
});
