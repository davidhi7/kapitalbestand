<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';

import IconRouterLink from '@/components/IconRouterLink.vue';

const props = defineProps({
    username: {
        type: String,
        required: true
    }
});

const breakpoints = useBreakpoints(breakpointsTailwind);
const compactMode = breakpoints.smaller('sm');

const display_menu = ref(false);

watch(compactMode, () => {
    display_menu.value = false;
});

const emit = defineEmits(['logout']);
</script>

<template>
    <nav
        class="fixed top-0 z-10 flex w-full justify-between bg-header-bg text-xl text-main-dark msm:flex-col"
        :class="{ 'msm:pb-1': display_menu }"
    >
        <!-- Button to toggle the menu, only visible on small screen devices -->
        <section class="self-end sm:hidden">
            <IconRouterLink
                :icon="display_menu ? 'pi-times' : 'pi-bars'"
                @click="display_menu = !display_menu"
            />
        </section>

        <!-- Main pages -->
        <section
            class="flex flex-col sm:flex-row"
            :class="{ 'msm:hidden': !display_menu }"
            @click="display_menu = false"
        >
            <IconRouterLink
                to="/"
                icon="pi-home"
                :label="compactMode ? 'Start' : undefined"
            />
            <IconRouterLink to="/new" icon="pi-plus" label="Neue Transaktion" />
            <IconRouterLink to="/list" icon="pi-list" label="Liste" />
            <IconRouterLink
                to="/analysis"
                icon="pi-chart-line"
                label="Analyse"
            />
        </section>

        <!-- Separator between main pages and logout; only on small screens -->
        <div
            class="m-1 h-px w-auto bg-main-dark sm:hidden"
            :class="{ hidden: !display_menu }"
        />

        <!-- Account settings & logout -->
        <section
            class="flex msm:justify-between"
            :class="{ 'msm:hidden': !display_menu }"
        >
            <IconRouterLink
                to="/account"
                icon="pi-user"
                :label="props.username"
                class="grow"
                @click="display_menu = false"
            />
            <IconRouterLink
                icon="pi-sign-out"
                @click="
                    display_menu = false;
                    emit('logout');
                "
            />
        </section>
    </nav>
</template>

<style scoped>
@reference '@/assets/base.css';

nav * {
    @apply -outline-offset-4 outline-main;
}
</style>
