<script setup>
import { watch, ref } from 'vue';

import { useAuthStateStore } from '@/stores/AuthStateStore';
import MenuBar from './MenuBar.vue';
import Notification from './Notification.vue';
import Login from '../LoginRegisterPage.vue';
import { useRoute } from 'vue-router';

const AuthStateStore = useAuthStateStore();
const route = useRoute()

const useFullWidth = ref(false);

watch(() => route.meta, (meta) => {
    useFullWidth.value = !!meta.fullWidth;
    console.log(useFullWidth.value)
});
</script>

<template>
    <Notification :class="{ 'mt-16': AuthStateStore.authenticated }" />
    <MenuBar v-if="AuthStateStore.authenticated" :username="AuthStateStore.username" @logout="AuthStateStore.logout" />
    <div class="sm:mx-auto mx-2 my-16" :class="{ 'sm:w-[600px]': !useFullWidth }">
        <Login v-if="!AuthStateStore.authenticated"></Login>
        <router-view v-else></router-view>
    </div>
</template>
