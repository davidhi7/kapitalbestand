import { createPinia } from 'pinia';
import 'primeicons/primeicons.css';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import { createApp } from 'vue';

import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

import '@/assets/base.css';
import App from '@/components/App.vue';
import router from '@/router';
import { authEventTarget, useAuthStateStore } from '@/stores/AuthStateStore';
import { useCategoryShopStore } from '@/stores/CategoryShopStore';
import { useTransactionStore } from '@/stores/TransactionStore';

const Preset = definePreset(Aura, {
    semantic: {
        colorScheme: {
            light: {
                surface: {
                    ground: '{surface.0}',
                    0: '#ffffff',
                    50: '{neutral.50}',
                    100: '{neutral.100}',
                    200: '{neutral.200}',
                    300: '{neutral.300}',
                    400: '{neutral.400}',
                    500: '{neutral.500}',
                    600: '{neutral.600}',
                    700: '{neutral.700}',
                    800: '{neutral.800}',
                    900: '{neutral.900}',
                    950: '{neutral.950}'
                }
            },
            dark: {
                surface: {
                    ground: '{surface.900}',
                    0: '#ffffff',
                    50: '{neutral.50}',
                    100: '{neutral.100}',
                    200: '{neutral.200}',
                    300: '{neutral.300}',
                    400: '{neutral.400}',
                    500: '{neutral.500}',
                    600: '{neutral.600}',
                    700: '{neutral.700}',
                    800: '{neutral.800}',
                    900: '{neutral.900}',
                    950: '{neutral.950}'
                }
            }
        }
    }
});

const app = createApp(App);
const pinia = createPinia();

app.use(router);
app.use(pinia);
app.use(PrimeVue, {
    theme: {
        preset: Preset
    },
    locale: {
        emptySearchMessage: 'Keine Einträge gefunden',
        dayNames: [
            'Sonntag',
            'Montag',
            'Dienstag',
            'Mittwoch',
            'Donnerstag',
            'Freitag',
            'Samstag'
        ],
        dayNamesShort: ['Son', 'Mon', 'Die', 'Mit', 'Don', 'Fre', 'Sam'],
        dayNamesMin: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
        monthNames: [
            'Januar',
            'Februar',
            'März',
            'April',
            'Mai',
            'Juni',
            'Juli',
            'August',
            'September',
            'Oktober',
            'November',
            'Dezember'
        ],
        monthNamesShort: [
            'Jan',
            'Feb',
            'Mär',
            'Apr',
            'Mai',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Okt',
            'Nov',
            'Dez'
        ],
        today: 'Heute',
        clear: 'Löschen'
    }
});
app.use(ToastService);

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
