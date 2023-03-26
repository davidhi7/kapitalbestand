<script setup>
import { useAuthStateStore } from '@/stores/AuthStateStore';

import MenuBar from './menu-bar/MenuBar.vue';
import Notification from './Notification.vue';
import Login from './LoginRegisterPage.vue';

const AuthStateStore = useAuthStateStore();
</script>

<template>
    <Notification :class="{ 'mt-16': AuthStateStore.authenticated }"/>
    <MenuBar v-if="AuthStateStore.authenticated" :username="AuthStateStore.username" @logout="AuthStateStore.logout"/>
    <div class="sm:w-[600px] sm:mx-auto mx-2 my-16">
        <Login v-if="!AuthStateStore.authenticated"></Login>
        <router-view v-else></router-view>
    </div>
</template>
