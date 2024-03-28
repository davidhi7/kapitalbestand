<script setup>
import { onMounted, ref } from 'vue';
import { useMq } from 'vue3-mq';

import IconRouterLink from './components/IconRouterLink.vue';

const props = defineProps({
    username: {
        type: String,
        required: true
    }
});

const mq = useMq();

const display_menu = ref(false);

onMounted(() => {
    display_menu.value = false;
});

defineEmits(['logout']);
</script>

<template>
    <nav
        class="fixed top-0 z-10 flex w-full justify-between bg-header-bg text-xl text-main-dark msm:flex-col"
        :class="{ 'msm:pb-1': display_menu }"
    >
        <!-- Button to toggle the menu, only visible on small screen devices -->
        <section class="self-end sm:hidden">
            <IconRouterLink
                class="relative -left-0.5 text-2xl"
                :icon="display_menu ? 'close' : 'menu'"
                @click="display_menu = !display_menu"
            />
        </section>

        <!-- Main pages -->
        <section
            class="flex flex-col sm:flex-row"
            :class="{ 'msm:hidden': !display_menu }"
            @click="display_menu = false"
        >
            <IconRouterLink to="/" icon="home" :label="mq.current === 'xs' ? 'Start' : null" />
            <IconRouterLink to="/new" icon="add" label="Neue Transaktion" />
            <IconRouterLink to="/list" icon="list" label="Liste" />
            <IconRouterLink to="/analysis" icon="query_stats" label="Analyse" />
        </section>

        <!-- Separator between main pages and logout; only on small screens -->
        <div class="m-1 h-px w-auto bg-main-dark sm:hidden" :class="{ hidden: !display_menu }" />

        <!-- Account settings & logout -->
        <section class="flex msm:justify-between" :class="{ 'msm:hidden': !display_menu }">
            <IconRouterLink
                to="/account"
                icon="manage_accounts"
                :label="props.username"
                :label-left="mq.current !== 'xs'"
                class="flex-grow"
                @click="display_menu = false"
            />
            <IconRouterLink
                icon="logout"
                @click="
                    display_menu = false;
                    $emit('logout');
                "
            />
        </section>
    </nav>
</template>

<style scoped>
nav * {
    @apply -outline-offset-4 outline-main;
}
</style>
