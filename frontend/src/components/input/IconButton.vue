<script setup lang="ts">
const props = defineProps<{
    iconName: string;
}>();
</script>

<template>
    <button
        class="grid aspect-square content-center rounded-md transition-colors hover:bg-tertiary-bg"
    >
        <span class="material-symbols-outlined p-1 text-2xl">{{ props.iconName }}</span>
    </button>
</template>
