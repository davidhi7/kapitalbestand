<script setup>
import { ref } from 'vue';
import { useAuthStateStore } from '../stores/AuthStateStore';
import { eventEmitter as $notificationBus } from '@/views/components/Notification.vue';
import GridForm from '@/views/components/GridForm.vue';

const AuthStateStore = useAuthStateStore();

const isRegisterForm = ref(false);
const username = ref('');
const password = ref('');
const passwordVerification = ref('');

function resetPasswordFields() {
    password.value = '';
    passwordVerification.value = '';
}

function toggleFormType() {
    resetPasswordFields();
    isRegisterForm.value = !isRegisterForm.value;
}

async function submit() {
    let endpoint;

    if (isRegisterForm.value) {
        if (password.value !== passwordVerification.value) {
            $notificationBus.emit('notification', { type: 'warning', content: 'Passwort falsch wiederholt!' });
            resetPasswordFields();
            return;
        }
        endpoint = '/api/auth/register';
    } else {
        endpoint = '/api/auth/login';
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ username: username.value, password: password.value }),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (response.status >= 400) {
        if (isRegisterForm.value) {
            $notificationBus.emit('notification', { type: 'error', content: 'Registrierung fehlgeschlagen' });
        } else {
            $notificationBus.emit('notification', { type: 'error', content: 'Anmeldung fehlgeschlagen' });
        }
        resetPasswordFields();
        return;
    }

    const { data } = await response.json();

    AuthStateStore.$patch({
        authenticated: true,
        username: data.username,
        sessionTimeout: data.sessionTimeout
    });
}
</script>

<template>
    <form @submit.prevent="submit" class="mt-8 flex flex-col items-center gap-4">
        <h1 class="bg-branding w-full bg-clip-text text-7xl font-bold leading-tight text-transparent text-center">
            Kapital&shy;bestand
        </h1>
        <hr class="bg-branding h-1 w-full border-none" />
        <GridForm>
            <span>Benutzername</span>
            <input type="text" required v-model="username" class="!border-main" />

            <span>Passwort</span>
            <input type="password" minlength="8" required v-model="password" class="!border-main" />

            <span v-if="isRegisterForm">Passwort bestätigen</span>
            <input
                v-if="isRegisterForm"
                type="password"
                minlength="8"
                required
                v-model="passwordVerification"
                class="!border-main"
            />
        </GridForm>
        <hr class="bg-branding h-1 w-full border-none" />
        <div class="flex flex-row gap-4 items-center">
            <button class="btn" type="submit" :name="isRegisterForm ? 'register' : 'login'">
                {{ isRegisterForm ? 'Registrieren' : 'Anmelden' }}
            </button>
            <span>
                Oder
                <button @click="toggleFormType"
                    class="cursor-pointer text-inherit underline decoration-1 hover:text-secondary dark:hover:text-secondary-dark">
                    {{ isRegisterForm ? 'anmelden' : 'neu registrieren' }} </button>?
            </span>
        </div>
    </form>
</template>
