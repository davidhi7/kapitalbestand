<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useAuthStateStore } from '@/stores/AuthStateStore';

import Login from '../LoginRegisterPage.vue';
import MenuBar from './MenuBar.vue';
import Notification from './Notification.vue';

const AuthStateStore = useAuthStateStore();
const route = useRoute();

const customWidth = ref();

watch(
    () => route.meta,
    () => {
        customWidth.value = route.meta.customWidth;
    },
    { immediate: true }
);
</script>

<template>
    <Notification :class="{ 'mt-16': AuthStateStore.authenticated }" />
    <MenuBar
        v-if="AuthStateStore.authenticated"
        :username="AuthStateStore.username"
        @logout="AuthStateStore.logout"
    />
    <div
        class="mx-2 my-16 sm:mx-auto"
        :class="[customWidth ? `sm:max-w-[${customWidth}]` : 'sm:max-w-[600px]']"
    >
        <Login v-if="!AuthStateStore.authenticated" />
        <router-view v-else />
    </div>
</template>
