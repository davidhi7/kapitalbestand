<script setup lang="ts">
import { MonthlyTransaction, OneoffTransaction } from '@backend-types/TransactionTypes';

import { Action, DeleteAction, EditAction, ExpandAction } from '.';

const props = defineProps<{
    action: Action | null;
    transaction: OneoffTransaction | MonthlyTransaction;
}>();

const emit = defineEmits<{
    done: [];
}>();

const actions = {
    [Action.EXPAND]: {
        component: ExpandAction,
        durationClass: 'duration-200'
    },
    [Action.EDIT]: {
        component: EditAction,
        durationClass: 'duration-300'
    },
    [Action.DELETE]: {
        component: DeleteAction,
        durationClass: 'duration-200'
    }
};
</script>

<template>
    <Transition name="separator" mode="out-in">
        <div
            v-if="props.action != null"
            class="mx-4 my-0 h-px bg-tertiary-bg"
            :class="actions[props.action].durationClass"
        />
    </Transition>
    <Transition name="action" mode="out-in">
        <div
            v-if="props.action != null"
            class="grid overflow-hidden"
            :class="actions[props.action].durationClass"
        >
            <div class="min-h-0 self-end">
                <div class="m-4">
                    <component
                        :is="actions[props.action].component"
                        :transaction="props.transaction"
                        @done="emit('done')"
                    />
                </div>
            </div>
        </div>
    </Transition>
</template>

<style>
.action-enter-active,
.separator-enter-active {
    transition-timing-function: ease-out;
    transition-property: grid-template-rows, opacity;
}

.action-leave-active,
.separator-leave-active {
    transition-duration: 0ms !important;
    transition-timing-function: ease-in;
    transition-property: grid-template-rows, opacity;
}

.action-enter-from,
.action-leave-to {
    grid-template-rows: 0fr;
    opacity: 0;

    & > * {
        opacity: 0;
    }
}

.separator-enter-from,
.separator-leave-to {
    opacity: 0;
}

.separator-enter-to,
.separator-leave-from {
    opacity: 1;
}

.action-enter-to,
.action-leave-from {
    grid-template-rows: 1fr;

    & > * {
        opacity: 1;
    }
}
</style>
