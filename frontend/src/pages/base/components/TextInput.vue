<script setup lang="ts">
defineOptions({
    inheritAttrs: false
});
const props = withDefaults(defineProps<{ required?: boolean, class?: string, showRequiredIndicator?: boolean }>(), { required: false, class: "", showRequiredIndicator: true });
const model = defineModel<string>();
</script>

<template>
    <div
        class="relative required-indicator bg-transparent hover:bg-input-bg border-input-bg border-[1px] rounded-lg shadow-sm hover:shadow-md"
        :class="[props.required && showRequiredIndicator ? 'after:!text-tertiary' : '', props.class]"
    >
        <input v-bind="$attrs" v-model="model" :required="props.required" class="bg-inherit outline-none py-1 px-2 rounded-lg" />
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

div:has(:focus-visible) {
    @apply outline-default;
}
</style>
