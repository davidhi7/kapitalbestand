<script setup lang="ts">
import { ref } from 'vue';

import IconButton from '@/components/input/IconButton.vue';

const props = defineProps<{ title: string }>();

const dialog = ref<HTMLDialogElement>();

defineExpose({
    open() {
        dialog.value!.showModal();
    },
    close() {
        dialog.value!.close();
    }
});
</script>

<template>
    <Teleport to="body">
        <dialog
            ref="dialog"
            class="flex-col gap-4 rounded-lg border-[1px] border-tertiary-bg bg-main-bg p-6 open:flex"
        >
            <header class="flex justify-between gap-4">
                <h1>{{ props.title }}</h1>
                <IconButton icon-name="close" @click="dialog!.close()" />
            </header>
            <main>
                <slot></slot>
            </main>
        </dialog>
    </Teleport>
</template>

<style scoped>
dialog[open] {
    animation: fadein 0.2s ease-out forwards;
}

dialog::backdrop {
    /* Firefox appears to not support backdrop animations, this construct sets the fixed backdrop for firefox, while animating in chromium */
    backdrop-filter: brightness(75%);
    animation: backdrop 0.1s linear forwards;
}

@keyframes backdrop {
    0% {
        backdrop-filter: brightness(100%);
    }
    100% {
        backdrop-filter: brightness(75%);
    }
}

@keyframes fadein {
    0% {
        translate: 0 -12px;
        opacity: 0.5;
    }
    100% {
        translate: 0 0;
        opacity: 1;
    }
}
</style>
