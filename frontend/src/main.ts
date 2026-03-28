import { createPinia } from 'pinia';
import 'primeicons/primeicons.css';
import PrimeVue from 'primevue/config';
import { createApp } from 'vue';

import Aura from '@primeuix/themes/aura';

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
app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
});

const AuthStateStore = useAuthStateStore();
const CategoryShopStore = useCategoryShopStore();
const TransactionStore = useTransactionStore();

authEventTarget.addEventListener('authentication', () => {
    CategoryShopStore.fetch();
});

authEventTarget.addEventListener('logout', () => {
    CategoryShopStore.$reset();
    TransactionStore.$reset();
});

AuthStateStore.requestWhoAmI().then(() => {
    app.mount('div#app');
});
