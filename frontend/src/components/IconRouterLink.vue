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
        class="flex items-center gap-2 border-l-4 border-r-0 border-transparent px-4 py-2 text-neutral-100 transition-colors hover:bg-neutral-700 sm:border-b-4 sm:border-l-0 dark:text-neutral-200 dark:hover:bg-neutral-900"
        :class="{
            'border-emerald-500! dark:border-neutral-200!': isActive
        }"
    />
</template>

<style scoped>
.nav-link {
    /*color: var(--main-dark);*/
    border-radius: 0;
    border-color: transparent;
    border-style: solid;
}
</style>
