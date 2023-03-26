import { defineStore } from 'pinia';

export const useAuthStateStore = defineStore('AuthState', {
    state: () => {
        return {
            authenticated: false,
            username: null,
            sessionTimeout: null
        };
    },
    actions: {
        async requestWhoAmI() {
            const response = await fetch('/api/auth/whoami');
            if (response.status >= 400) {
                this.$patch({
                    authenticated: false,
                    username: null,
                    sessionTimeout: NaN
                });
            } else {
                const body = await response.json();
                this.$patch({
                    authenticated: true,
                    username: body.data.username,
                    sessionTimeout: body.data.sessionTimeout
                });
            }
        },
        async logout() {
            fetch('/api/auth/logout');
            this.$reset();
        },
        async refresh() {
            // TODO implement
        }
    }
});
