<script setup lang="ts">
import Button from 'primevue/button';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps<{
    to?: string;
    icon?: string;
    label?: string;
}>();

const route = useRoute();
const isActive = computed(() => props.to != null && route.path === props.to);
</script>

<template>
    <!-- in case of a link make this into a router link for navigation -->
    <Button
        :as="to ? 'router-link' : undefined"
        :to="to"
        :icon="icon ? 'pi ' + icon : undefined"
        :label="label"
        unstyled
        class="nav-link flex cursor-pointer items-center gap-2 border-l-2 px-4 py-2 sm:border-b-2 sm:border-l-0"
        :class="{
            'nav-link-active': isActive
        }"
    />
</template>

<style scoped>
.nav-link {
    color: var(--main-dark);
    border-radius: 0;
    border-color: transparent;
    border-style: solid;
}

.nav-link:hover {
    background: var(--header-bg-hover);
    color: var(--main-dark);
}

.nav-link-active {
    border-color: var(--main-dark);
}
</style>
