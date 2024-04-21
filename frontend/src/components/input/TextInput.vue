<script setup lang="ts">
defineOptions({
    inheritAttrs: false
});
const props = withDefaults(
    defineProps<{
        required?: boolean;
        class?: string;
        showRequiredIndicator?: boolean;
    }>(),
    {
        required: false,
        class: '',
        showRequiredIndicator: true
    }
);
const model = defineModel<string>();
</script>

<template>
    <div
        class="required-indicator relative rounded-lg border-[1px] border-input-bg bg-transparent shadow-sm transition-colors hover:bg-input-bg hover:shadow-md"
        :class="[
            props.required && showRequiredIndicator ? 'after:!text-tertiary' : '',
            props.class
        ]"
    >
        <input
            v-bind="$attrs"
            v-model="model"
            :required="props.required"
            class="w-full rounded-lg bg-inherit py-1 pl-2 pr-3 outline-none"
        />
    </div>
</template>

<style scoped>
.required-indicator::after {
    position: absolute;
    top: 6px;
    right: 4px;
    content: '*';
    color: transparent;
}
</style>
