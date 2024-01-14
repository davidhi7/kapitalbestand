<script>
export default {
    props: {
        to: {
            type: String,
            required: false
        },
        icon: {
            type: String,
            required: false
        },
        label: {
            type: String,
            required: false
        },
        labelLeft: {
            type: Boolean,
            required: false
        }
    }
};
</script>

<template>
    <component :is="to ? 'router-link' : 'button'" :to="to" class="flex flex-row sm:flex-col cursor-pointer hover:bg-header-bg-hover">
        <!--
            Indicator visible if the current url matches the link; Located on wide screens on the top, on mobile devices on the left
            If the router 'link' is only a button, don't show this
        -->
        <div v-if="to != null" class="w-1 sm:w-auto sm:h-1"></div>
        <!-- Container for the icon and label, respecting the space occupied by the indicator. -->
        <div class="flex items-center grow pt-2 sm:pt-1 pl-1 sm:pl-2 pb-2 pr-2 content" :class="{ 'pl-2 sm:pt-2': to == null }">
            <span class="text-[1em] mx-0.5" v-if="label && labelLeft">
                {{ label }}
            </span>
            <span class="material-symbols-outlined text-[1.25em] mx-0.5 select-none" v-if="icon">
                {{ icon }}
            </span>
            <span class="text-[1em] mx-0.5" v-if="label && !labelLeft">
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
