<script setup lang="ts" generic="T extends OneoffTransaction | MonthlyTransaction">
import { computed, ref } from 'vue';

import { MonthlyTransaction, OneoffTransaction } from '@backend-types/TransactionTypes';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';

import { ColumnSettings } from '@/components/lists/listConfig';

import { Action, ActionContainer } from '.';

const props = defineProps<{
    transaction: T;
    columnSettings: ColumnSettings<T>[];
}>();

const breakpoints = useBreakpoints(breakpointsTailwind);

const filteredColumns = computed(() => {
    return props.columnSettings.filter((value) => {
        return value.breakpoint === '' || breakpoints.greaterOrEqual(value.breakpoint).value;
    });
});

let enabledAction = ref<Action | null>(null);

function toggle(action: Action | null) {
    const newValue = enabledAction.value === action ? null : action;
    enabledAction.value = null;
    // by setting the enabled action later, the new action is displayed with a transition. Otherwise, there would be no transition.
    requestAnimationFrame(() => {
        enabledAction.value = newValue;
    });
}
</script>

<template>
    <tr class="contents child:odd:bg-secondary-bg child:even:bg-main-bg">
        <td v-for="(column, index) in filteredColumns" :key="index">
            {{ column.extractor(props.transaction) }}
        </td>
        <td class="col-span-full flex justify-end !py-1 sm:col-span-1 sm:justify-center">
            <!-- Disable animation on hiding to avoid unneccessary distractions -->
            <!--<button :class="{ 'child:rotate-180 child:transition-transform child:duration-200': expandEnabled }" @click="toggle(actions.EXPAND)">-->
            <button @click="toggle(Action.EXPAND)">
                <span
                    class="material-symbols-outlined transition-transform duration-200"
                    :class="{
                        'rotate-180': enabledAction === Action.EXPAND
                    }"
                >
                    expand_more
                </span>
            </button>
            <button @click="toggle(Action.EDIT)">
                <span
                    class="material-symbols-outlined"
                    :class="{ 'material-symbols-filled': enabledAction === Action.EDIT }"
                >
                    edit
                </span>
            </button>
            <button @click="toggle(Action.DELETE)">
                <span
                    class="material-symbols-outlined"
                    :class="{ 'material-symbols-filled': enabledAction === Action.DELETE }"
                >
                    delete
                </span>
            </button>
        </td>
        <td class="col-span-full !p-0">
            <ActionContainer
                :action="enabledAction"
                :transaction="props.transaction"
                @done="toggle(null)"
            />
        </td>
    </tr>
</template>

<style scoped>
td {
    @apply overflow-hidden text-ellipsis whitespace-nowrap p-2 text-center;
}

td > button {
    @apply grid aspect-square content-center border-r-[1px] border-input-bg;

    &:first-child {
        @apply rounded-l-md;
    }

    &:last-child {
        @apply rounded-r-md border-none;
    }

    &:hover {
        @apply bg-tertiary-bg;
    }

    & > span {
        @apply p-1 !text-xl;
    }
}
</style>
