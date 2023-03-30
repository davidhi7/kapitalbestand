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
        class="fixed top-0 w-full flex msm:flex-col justify-between bg-header-bg dark:bg-header-bg-dark text-main-dark text-xl z-10"
        :class="{ 'msm:pb-1': display_menu }"
    >
        <!-- Button to toggle the menu, only visible on small screen devices -->
        <section class="sm:hidden self-end">
            <IconRouterLink
                class="text-2xl relative -left-0.5"
                :icon="display_menu ? 'close' : 'menu'"
                @click="display_menu = !display_menu"
            >
            </IconRouterLink>
        </section>

        <!-- Main pages -->
        <section
            class="flex flex-col sm:flex-row"
            :class="{ 'msm:hidden': !display_menu }"
            @click="display_menu = false"
        >
            <IconRouterLink to="/" icon="home" :label="mq.current === 'xs' ? 'Start' : null"></IconRouterLink>
            <IconRouterLink to="/new" icon="add" label="Neue Transaktion"> </IconRouterLink>
            <IconRouterLink to="/list" icon="list" label="Liste"></IconRouterLink>
            <IconRouterLink to="/analysis" icon="bar_chart" label="Analyse"></IconRouterLink>
        </section>

        <!-- Separator between main pages and logout; only on small screens -->
        <div class="m-1 w-auto h-[1px] bg-main-dark sm:hidden" :class="{ hidden: !display_menu }"></div>

        <!-- Account settings & logout -->
        <section class="flex msm:justify-between" :class="{ 'msm:hidden': !display_menu }">
            <IconRouterLink
                to="/account"
                icon="manage_accounts"
                :label="props.username"
                :label-left="mq.current !== 'xs'"
                @click="display_menu = false"
                class="flex-grow"
            ></IconRouterLink>
            <IconRouterLink
                icon="logout"
                @click="
                    display_menu = false;
                    $emit('logout');
                "
            ></IconRouterLink>
        </section>
    </nav>
</template>
