import { defineStore } from 'pinia';

interface State {
    authenticated: boolean;
    username: string | null;
    sessionTimeout: number | null;
}

export enum AuthResponse {
    Success,
    Fail
}

export const authEventTarget = new EventTarget();

export const useAuthStateStore = defineStore('AuthState', {
    state: (): State => {
        return {
            authenticated: false,
            username: null,
            sessionTimeout: null
        };
    },
    actions: {
        async requestWhoAmI() {
            const authResponse = await this.parseAuthResponse(await fetch('/api/auth/whoami'));
            this.dispatchAuthenticationEvents(authResponse);
            return authResponse;
        },

        async login(username: string, password: string, register?: boolean) {
            if (this.authenticated) {
                this.logout();
            }
            const response = await fetch(register ? '/api/auth/register' : '/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username: username, password: password }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const authResponse = await this.parseAuthResponse(response);
            this.dispatchAuthenticationEvents(authResponse);
            return authResponse;
        },

        async parseAuthResponse(response: Response): Promise<AuthResponse> {
            if (response.status >= 400) {
                this.$reset();
                return AuthResponse.Fail;
            }

            const { data } = await response.json();
            this.$patch({
                authenticated: true,
                username: data.username,
                sessionTimeout: data.sessionTimeout
            });
            return AuthResponse.Success;
        },

        dispatchAuthenticationEvents(authResponse: AuthResponse) {
            if (authResponse === AuthResponse.Success) {
                authEventTarget.dispatchEvent(new Event('authentication'));
            }
        },

        async logout() {
            fetch('/api/auth/logout');
            authEventTarget.dispatchEvent(new Event('logout'));
            this.$reset();
        },

        async refresh() {
            // TODO implement
        }
    }
});
