<script setup lang="ts">
import { ref } from 'vue';

import { NotificationEvent, NotificationStyle, eventEmitter } from '@/pages/base/Notification.vue';
import GridForm from '@/pages/transaction-form/GridForm.vue';
import { AuthResponse, useAuthStateStore } from '@/stores/AuthStateStore';

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
    const register = isRegisterForm.value;

    if (register) {
        if (password.value !== passwordVerification.value) {
            eventEmitter.dispatchEvent(new NotificationEvent(NotificationStyle.WARNING, 'Passwort falsch wiederholt!'));
            resetPasswordFields();
            return;
        }
    }
    const status = await AuthStateStore.login(username.value, password.value, register);
    resetPasswordFields();

    if (status !== AuthResponse.Success) {
        eventEmitter.dispatchEvent(
            new NotificationEvent(NotificationStyle.ERROR, `${register ? 'Registrierung' : 'Anmeldung'} fehlgeschlagen`)
        );
    }
}
</script>

<template>
    <form @submit.prevent="submit" class="flex flex-col items-center gap-4">
        <h1 class="bg-branding w-full bg-clip-text text-7xl font-bold leading-tight text-transparent text-center">
            Kapital&shy;bestand
        </h1>
        <hr class="bg-branding h-1 w-full border-none" />
        <GridForm>
            <span>Benutzername</span>
            <input type="text" required v-model="username" />

            <span>Passwort</span>
            <input type="password" minlength="8" required v-model="password" />

            <span v-if="isRegisterForm">Passwort bestätigen</span>
            <input
                v-if="isRegisterForm"
                type="password"
                minlength="8"
                required
                v-model="passwordVerification"
            />
        </GridForm>
        <hr class="bg-branding h-1 w-full border-none" />
        <div class="flex flex-row gap-4 items-center">
            <button class="btn" type="submit" :name="isRegisterForm ? 'register' : 'login'">
                {{ isRegisterForm ? 'Registrieren' : 'Anmelden' }}
            </button>
            <span>
                Oder
                <button
                    @click="toggleFormType"
                    type="button"
                    class="cursor-pointer text-inherit underline decoration-1 hover:text-secondary"
                >
                    {{ isRegisterForm ? 'anmelden' : 'neu registrieren' }}</button
                >?
            </span>
        </div>
    </form>
</template>
