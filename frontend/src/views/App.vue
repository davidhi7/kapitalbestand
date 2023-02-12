<script setup>
import { ref } from 'vue';
import { mapStores } from 'pinia';
import { useAuthStateStore } from '@/stores/AuthStateStore';

import MenuBar from './MenuBar.vue';
import IconRouterLink from './components/IconRouterLink.vue';
import Notification from './components/Notification.vue';
import Login from './LoginRegisterPage.vue';

const AuthStateStore = useAuthStateStore();

const display_menu = ref(false);

function logout() {
    fetch('/api/auth/logout');
    AuthStateStore.$reset();
}
</script>

<template>
    <Notification />
    <MenuBar v-if="AuthStateStore.authenticated" :username="AuthStateStore.username" @logout="logout"/>
    <div class="landscape:w-[650px] landscape:mx-auto portrait:mx-2 mt-4">
        <Login v-if="!AuthStateStore.authenticated"></Login>
        <router-view v-else></router-view>
    </div>
</template>
