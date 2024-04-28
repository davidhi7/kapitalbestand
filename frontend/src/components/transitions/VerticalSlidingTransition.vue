<script setup lang="ts">
export type DurationClass = `duration-${0 | 75 | 100 | 150 | 200 | 300 | 500 | 700 | 1000}`;

const props = defineProps<{
    durationClass: DurationClass;
    render: boolean;
}>();
</script>

<template>
    <Transition>
        <div class="grid overflow-hidden" :class="[props.durationClass]" v-if="props.render">
            <div class="min-h-0 self-end">
                <slot></slot>
            </div>
        </div>
    </Transition>
</template>

<style>
.v-enter-active {
    transition-timing-function: ease-out;
    transition-property: grid-template-rows, opacity;
}

.v-leave-active {
    transition-timing-function: ease-in;
    transition-property: grid-template-rows, opacity;
}

.v-enter-from,
.v-leave-to {
    grid-template-rows: 0fr;
    opacity: 0;
}
.v-enter-to,
.v-leave-from {
    grid-template-rows: 1fr;
    opacity: 1;
}
</style>
