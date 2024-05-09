<script setup lang="ts">
import LoadingSpinner from '@/components/LoadingSpinner.vue';

const props = defineProps<{
    loading: boolean;
}>();
</script>

<template>
    <button class="btn grid grid-cols-1 grid-rows-1 place-items-center">
        <span
            class="col-start-1 col-end-1 row-span-1 row-end-1"
            :class="{ invisible: props.loading }"
        >
            <slot></slot>
        </span>
        <LoadingSpinner
            class="invisible col-start-1 col-end-1 row-span-1 row-end-1"
            :class="{ '!visible': props.loading }"
        />
    </button>
</template>
