import { createApp } from 'vue';
import { createPinia } from 'pinia';

import { eventEmitter } from '@/views/components/Notification.vue';
import router from '@/router';
import App from '@/views/App.vue';

import { useAuthStateStore } from '@/stores/AuthStateStore';
import { useCategoryShopStore } from '@/stores/CategoryShopStore';

import '@/assets/base.less';
import '@/assets/icons.css';



const app = createApp(App);
const pinia = createPinia();
app.use(router);
app.use(pinia);
app.mount('div#app');
const AuthStateStore = useAuthStateStore();
const CategoryShopStore = useCategoryShopStore();

AuthStateStore.requestWhoAmI();
// TODO: do this on login
CategoryShopStore.fetch();

app.config.globalProperties.$notificationBus = eventEmitter;
