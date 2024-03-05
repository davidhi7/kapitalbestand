<script setup lang="ts">
defineOptions({
    inheritAttrs: false
});
const props = withDefaults(defineProps<{ required?: boolean; class?: string; showRequiredIndicator?: boolean, value?: string }>(), {
    required: false,
    class: '',
    showRequiredIndicator: true,
    value: ''
});
const model = defineModel<string>();
if (props.value) {
    model.value = props.value;
}
</script>

<template>
    <div
        class="relative required-indicator bg-transparent hover:bg-input-bg border-input-bg border-[1px] rounded-lg shadow-sm hover:shadow-md"
        :class="[props.required && showRequiredIndicator ? 'after:!text-tertiary' : '', props.class]"
    >
        <input
            v-bind="$attrs"
            v-model="model"
            :required="props.required"
            class="bg-inherit outline-none py-1 pl-2 pr-3 rounded-lg box-border"
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
