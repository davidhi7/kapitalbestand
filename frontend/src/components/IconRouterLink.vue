<script setup lang="ts">
defineProps<{
    to?: string;
    icon?: string;
    label?: string;
    labelLeft?: boolean;
}>();
</script>

<template>
    <component
        :is="to ? 'router-link' : 'button'"
        :to="to"
        class="flex cursor-pointer flex-row transition-colors hover:bg-header-bg-hover sm:flex-col"
    >
        <!--
            Indicator visible if the current url matches the link; Located on wide screens on the top, on mobile devices on the left
            If the router 'link' is only a button, don't show this
        -->
        <div v-if="to != null" class="w-1 sm:h-1 sm:w-auto" />
        <!-- Container for the icon and label, respecting the space occupied by the indicator. -->
        <div
            class="content flex grow items-center pb-2 pl-1 pr-2 pt-2 sm:pl-2 sm:pt-1"
            :class="{ 'pl-2 sm:pt-2': to == null }"
        >
            <span v-if="label && labelLeft" class="mx-0.5 text-[1em]">
                {{ label }}
            </span>
            <span v-if="icon" class="material-symbols-outlined mx-0.5 select-none text-[1.25em]">
                {{ icon }}
            </span>
            <span v-if="label && !labelLeft" class="mx-0.5 text-[1em]">
                {{ label }}
            </span>
        </div>
    </component>
</template>

<style scoped>
a.router-link-active > :first-child {
    @apply bg-main-dark;
}
</style>
