<script setup>
import { ref, onMounted } from 'vue';
import IconRouterLink from './components/IconRouterLink.vue';

const props = defineProps({
    username: {
        type: String,
        required: true
    }
});

const display_menu = ref(false);

onMounted(() => {
    display_menu.value = false;
});

defineEmits(['logout']);
</script>

<template>
    <nav class="w-full flex justify-between bg-header-bg-dark text-main-dark">
        <!-- Button to toggle the menu, only visible on portrait devices -->
        <section class="landscape:hidden">
            <IconRouterLink icon="menu" @click="display_menu = !display_menu"></IconRouterLink>
        </section>
        <!-- Main pages -->
        <section class="flex" :class="{ 'portrait:hidden': !display_menu }">
            <IconRouterLink @click="display_menu = false" to="/" icon="home" class="large"></IconRouterLink>
            <IconRouterLink
                @click="display_menu = false"
                to="/new"
                icon="add"
                label="Neue Transaktion"
            ></IconRouterLink>
            <IconRouterLink @click="display_menu = false" to="/list" icon="list" label="Liste"></IconRouterLink>
            <IconRouterLink @click="display_menu = false" to="/test" icon="bug_report" label="Test"></IconRouterLink>
        </section>
        <!-- Account settings & logout -->
        <section class="flex" :class="{ 'portrait:hidden': !display_menu }">
            <IconRouterLink
                @click="display_menu = false"
                to="/account"
                icon="manage_accounts"
                :label="props.username"
                label-left="true"
            ></IconRouterLink>
            <IconRouterLink icon="logout" @click="$emit('logout')"></IconRouterLink>
        </section>
    </nav>
</template>

<style scoped lang="less">
@media (orientation: portrait) {
    nav, section {
        flex-direction: column;
    }
}
</style>
