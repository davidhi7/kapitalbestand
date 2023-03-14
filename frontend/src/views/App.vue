<script setup>
import { useAuthStateStore } from '@/stores/AuthStateStore';

import MenuBar from './MenuBar.vue';
import Notification from './components/Notification.vue';
import Login from './LoginRegisterPage.vue';

const AuthStateStore = useAuthStateStore();

function logout() {
    fetch('/api/auth/logout');
    AuthStateStore.$reset();
}
</script>

<template>
    <Notification :class="{ 'mt-16': AuthStateStore.authenticated }"/>
    <MenuBar v-if="AuthStateStore.authenticated" :username="AuthStateStore.username" @logout="logout"/>
    <div class="sm:w-[600px] sm:mx-auto mx-2 my-16">
        <Login v-if="!AuthStateStore.authenticated"></Login>
        <router-view v-else></router-view>
    </div>
</template>
