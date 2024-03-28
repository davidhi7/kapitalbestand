<script setup lang="ts">
import { ref } from 'vue';

import { NotificationEvent, NotificationStyle, eventEmitter } from '@/components/Notification.vue';
import GridForm from '@/components/forms/GridForm.vue';
import { AuthResponse, useAuthStateStore } from '@/stores/AuthStateStore';

import TextInput from '@/components/TextInput.vue';

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
            eventEmitter.dispatchEvent(
                new NotificationEvent(NotificationStyle.WARNING, 'Passwort falsch wiederholt!')
            );
            resetPasswordFields();
            return;
        }
    }
    const status = await AuthStateStore.login(username.value, password.value, register);
    resetPasswordFields();

    if (status !== AuthResponse.Success) {
        eventEmitter.dispatchEvent(
            new NotificationEvent(
                NotificationStyle.ERROR,
                `${register ? 'Registrierung' : 'Anmeldung'} fehlgeschlagen`
            )
        );
    }
}
</script>

<template>
    <form class="flex flex-col items-center gap-4" @submit.prevent="submit">
        <h1
            class="bg-gradient w-full bg-clip-text text-center text-7xl font-bold leading-tight text-transparent"
        >
            Kapital&shy;bestand
        </h1>
        <hr class="bg-gradient h-1 w-full border-none" />
        <GridForm>
            <span>Benutzername</span>
            <TextInput
                v-model.lazy="username"
                type="text"
                required
                :show-required-indicator="false"
            />

            <span>Passwort</span>
            <TextInput
                v-model.lazy="password"
                type="password"
                minlength="8"
                required
                :show-required-indicator="false"
            />

            <span v-if="isRegisterForm">Passwort bestätigen</span>
            <TextInput
                v-if="isRegisterForm"
                v-model.lazy="passwordVerification"
                type="password"
                minlength="8"
                required
                :show-required-indicator="false"
            />
        </GridForm>
        <hr class="bg-gradient h-1 w-full border-none" />
        <div class="flex flex-row items-center gap-4">
            <button class="btn" type="submit" :name="isRegisterForm ? 'register' : 'login'">
                {{ isRegisterForm ? 'Registrieren' : 'Anmelden' }}
            </button>
            <span>
                Oder
                <button
                    type="button"
                    class="cursor-pointer text-inherit underline decoration-1 transition-colors hover:text-tertiary"
                    @click="toggleFormType"
                >
                    {{ isRegisterForm ? 'anmelden' : 'neu registrieren' }}</button
                >?
            </span>
        </div>
    </form>
</template>
