<script setup lang="ts">
import Button from 'primevue/button';
import FloatLabel from 'primevue/floatlabel';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';

import { AuthResponse, useAuthStateStore } from '@/stores/AuthStateStore';

const AuthStateStore = useAuthStateStore();
const toast = useToast();

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
            toast.add({
                severity: 'warn',
                summary: 'Passwort falsch wiederholt!',
                life: 3000
            });
            resetPasswordFields();
            return;
        }
    }
    const status = await AuthStateStore.login(
        username.value,
        password.value,
        register
    );
    resetPasswordFields();

    if (status !== AuthResponse.Success) {
        toast.add({
            severity: 'error',
            summary: `${register ? 'Registrierung' : 'Anmeldung'} fehlgeschlagen`,
            life: 3000
        });
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
        <div class="flex w-full max-w-md flex-col gap-4">
            <FloatLabel variant="in">
                <InputText
                    id="username"
                    v-model="username"
                    type="text"
                    required
                    fluid
                />
                <label for="username">Benutzername</label>
            </FloatLabel>

            <FloatLabel variant="in">
                <Password
                    v-model="password"
                    input-id="password"
                    :feedback="false"
                    toggle-mask
                    minlength="8"
                    required
                    fluid
                />
                <label for="password">Passwort</label>
            </FloatLabel>

            <FloatLabel v-if="isRegisterForm" variant="in">
                <Password
                    v-model="passwordVerification"
                    input-id="password-verification"
                    :feedback="false"
                    toggle-mask
                    minlength="8"
                    required
                    fluid
                />
                <label for="password-verification">Passwort bestätigen</label>
            </FloatLabel>
        </div>
        <div class="flex flex-row items-center gap-4">
            <Button
                type="submit"
                :label="isRegisterForm ? 'Registrieren' : 'Anmelden'"
            />
            <span class="flex flex-row items-center gap-1">
                oder
                <Button
                    type="button"
                    link
                    :label="isRegisterForm ? 'anmelden' : 'neu registrieren'"
                    @click="toggleFormType"
                />
            </span>
        </div>
        <hr class="bg-gradient h-1 w-full border-none" />
    </form>
</template>
