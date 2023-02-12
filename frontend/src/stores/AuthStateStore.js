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
                this.authenticated = false;
                this.username = null;
                this.sessionTimeout = NaN;
            } else {
                const body = await response.json();
                this.authenticated = true;
                this.username = body.data.username;
                this.sessionTimeout = body.data.sessionTimeout;
            }
        },
        async refresh() {
            // TODO implement
        }
    }
});
