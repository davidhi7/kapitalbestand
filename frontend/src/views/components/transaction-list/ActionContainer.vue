<script setup>
import { inject } from 'vue';

import { ExpandAction, EditAction, DeleteAction } from '.';

const actions = {
    'ExpandAction': {
        component: ExpandAction,
        durationClass: 'duration-100'
    },
    'EditAction': {
        component: EditAction,
        durationClass: 'duration-200'
    },
    'DeleteAction': {
        component: DeleteAction,
        durationClass: 'duration-100'
    }
};

const props = defineProps({
    action: {
        type: String,
        validator(value) {
            return value === null || ['ExpandAction', 'EditAction', 'DeleteAction'].includes(value);
        }
    },
    transaction: {
        type: Object
    }
});
</script>

<template>
    <Transition name="action">
        <div v-if="props.action !== null" :class="actions[props.action].durationClass">
            <div>
                <div class="px-2">
                    <div class="h-[1px] bg-tertiary-bg dark:bg-tertiary-bg-dark"></div>
                </div>
                <div class="p-2">
                    <KeepAlive>
                        <component :is="actions[props.action].component" @done="$emit('done')" :transaction="props.transaction" />
                    </KeepAlive>
                </div>
            </div>
        </div>
    </Transition>
</template>

<style lang="less">
.action-enter-active,
.action-leave-active {
    transition: all ease-out;
}

.action-enter-from,
.action-leave-to {
    display: grid;
    grid-template-rows: 0fr;
    overflow: hidden;

    &>* {
        visibility: hidden;
        min-height: 0;
        align-self: end;
    }
}

.action-enter-to,
.action-leave-from {
    display: grid;
    grid-template-rows: 1fr;
    overflow: hidden;

    &>* {
        visibility: visible;
        min-height: 0;
        align-self: end;
    }
}
</style>
