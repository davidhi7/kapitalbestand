<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import MenuBar from '@/components/MenuBar.vue';
import Notification from '@/components/Notification.vue';
import AuthenticationPage from '@/components/pages/Authentication.vue';
import { useAuthStateStore } from '@/stores/AuthStateStore';

const AuthStateStore = useAuthStateStore();
const route = useRoute();

const fillWidth = ref(false);

watch(
    () => route.meta,
    () => {
        fillWidth.value = route.meta.fillWidth || false;
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
        class="mx-2 my-16"
        :class="[
            fillWidth && AuthStateStore.authenticated
                ? `sm:mx-8 sm:w-auto`
                : 'sm:mx-auto sm:max-w-2xl'
        ]"
    >
        <AuthenticationPage v-if="!AuthStateStore.authenticated" />
        <router-view v-else />
    </div>
</template>
