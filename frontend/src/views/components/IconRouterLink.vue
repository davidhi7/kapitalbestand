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
    <component :is="to ? 'router-link' : 'a'" class="flex flex-row sm:flex-col cursor-pointer hover:text-secondary-dark" :to="to">
        <div class="w-1 sm:w-auto sm:h-1"></div>
        <div class="flex items-center grow pt-2 sm:pt-1 pl-1 sm:pl-2 pb-2 pr-2 content">
            <span class="text-[1em] mx-0.5" v-if="label && labelLeft">
                {{ label }}
            </span>
            <span class="material-symbols-outlined text-[1.25em] mx-0.5" v-if="icon">
                {{ icon }}
            </span>
            <span class="text-[1em] mx-0.5" v-if="label && !labelLeft">
                {{ label }}
            </span>
        </div>
    </component>
</template>

<style scoped lang="less">
a.router-link-exact-active > :first-child {
    @apply bg-main-dark;
}
a.router-link-exact-active:hover > :first-child {
    @apply bg-secondary-dark;
}
</style>
