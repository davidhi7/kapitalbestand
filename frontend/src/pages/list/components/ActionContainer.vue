<script setup>
import { DeleteAction, EditAction, ExpandAction } from '.';

const actions = {
    ExpandAction: {
        component: ExpandAction,
        durationClass: 'duration-100'
    },
    EditAction: {
        component: EditAction,
        durationClass: 'duration-200'
    },
    DeleteAction: {
        component: DeleteAction,
        durationClass: 'duration-100'
    }
};

const props = defineProps({
    action: {
        type: String,
        validator(value) {
            return value === null || ['ExpandAction', 'EditAction', 'DeleteAction'].includes(value);
        },
        required: true
    },
    transaction: {
        type: Object,
        required: true
    }
});

defineEmits(['done']);
</script>

<template>
    <div v-if="props.action" class="mx-2 my-0 h-px bg-tertiary-bg" />
    <Transition name="action">
        <div
            v-if="props.action"
            class="grid overflow-hidden"
            :class="actions[props.action].durationClass"
        >
            <div class="min-h-0 self-end">
                <div class="m-2">
                    <KeepAlive>
                        <component
                            :is="actions[props.action].component"
                            :transaction="props.transaction"
                            @done="$emit('done')"
                        />
                    </KeepAlive>
                </div>
            </div>
        </div>
    </Transition>
</template>

<style>
.action-enter-active {
    transition-timing-function: ease-out;
    transition-property: grid-template-rows, opacity;
}

.action-leave-active {
    transition-timing-function: ease-in;
    transition-property: grid-template-rows, opacity;
}

.action-enter-from,
.action-leave-to {
    grid-template-rows: 0fr;
    opacity: 0;

    & > * {
        visibility: hidden;
    }
}

.action-enter-to,
.action-leave-from {
    grid-template-rows: 1fr;

    & > * {
        visibility: visible;
    }
}
</style>
