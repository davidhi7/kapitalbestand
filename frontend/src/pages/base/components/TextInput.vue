<script setup lang="ts">
defineOptions({
    inheritAttrs: false
});
const props = withDefaults(
    defineProps<{
        required?: boolean;
        class?: string;
        showRequiredIndicator?: boolean;
        value?: string;
    }>(),
    {
        required: false,
        class: '',
        showRequiredIndicator: true,
        value: ''
    }
);
const model = defineModel<string>();
if (props.value) {
    model.value = props.value;
}
</script>

<template>
    <div
        class="required-indicator relative rounded-lg border-[1px] border-input-bg bg-transparent shadow-sm hover:bg-input-bg hover:shadow-md"
        :class="[
            props.required && showRequiredIndicator ? 'after:!text-tertiary' : '',
            props.class
        ]"
    >
        <input
            v-bind="$attrs"
            v-model="model"
            :required="props.required"
            class="box-border rounded-lg bg-inherit py-1 pl-2 pr-3 outline-none"
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
