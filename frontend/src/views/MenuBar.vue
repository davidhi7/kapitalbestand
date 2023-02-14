<script setup>
import { ref, onMounted } from 'vue';
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
        class="fixed top-0 msm:pb-1 w-full flex flex-col sm:flex-row justify-between bg-header-bg dark:bg-header-bg-dark text-main-dark">
        <!-- Button to toggle the menu, only visible on portrait devices -->
        <section class="sm:hidden">
            <IconRouterLink :icon="display_menu ? 'close' : 'menu'" @click="display_menu = !display_menu"></IconRouterLink>
        </section>
        <!-- Main pages -->
        <section class="flex flex-col sm:flex-row" :class="{ 'msm:hidden': !display_menu }">
            <IconRouterLink @click="display_menu = false" to="/" icon="home" :label="mq.current === 'xs' ? 'Start' : null"></IconRouterLink>
            <IconRouterLink @click="display_menu = false" to="/new" icon="add" label="Neue Transaktion">
            </IconRouterLink>
            <IconRouterLink @click="display_menu = false" to="/list" icon="list" label="Liste"></IconRouterLink>
        </section>
        <!-- Separator between main pages and logout; only on mobile -->
        <div class="mx-2 my-1 w-auto h-[1px] bg-white dark:bg-main-bg-dark sm:hidden" :class="{ 'hidden': !display_menu }"></div>
        <!-- Account settings & logout -->
        <section class="flex flex-row msm:justify-between" :class="{ 'msm:hidden': !display_menu }">
            <IconRouterLink @click="display_menu = false" to="/account" icon="manage_accounts" :label="props.username"
                :label-left="true"></IconRouterLink>
            <IconRouterLink icon="logout" @click="$emit('logout')"></IconRouterLink>
        </section>
    </nav>
</template>
