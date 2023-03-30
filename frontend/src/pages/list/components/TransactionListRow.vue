<script setup>
import { inject, computed, ref } from 'vue';

import { format_currency as formatCurrency, format_year_month as formatMonth } from '@/common';
import { ActionContainer } from '.';

const actions = {
    EXPAND: 'ExpandAction',
    EDIT: 'EditAction',
    DELETE: 'DeleteAction'
};

const props = defineProps({
    transaction: {
        type: Object,
        required: true
    }
});

let enabledAction = ref(null);
function toggle(action) {
    const newValue = enabledAction.value === action ? null : action;
    enabledAction.value = null;
    // by setting the enabled action later, the new action is displayed with a transition. Otherwise, there would be no transition.
    requestAnimationFrame(() => {
        enabledAction.value = newValue;
    });
}

const frequency = inject('frequency');
</script>

<template>
    <tr
        class="contents child:even:bg-main-bg dark:child:even:bg-main-bg-dark child:odd:bg-secondary-bg dark:child:odd:bg-secondary-bg-dark">
        <td v-if="frequency === 'oneoff'">
            {{ props.transaction.date }}
        </td>
        <td v-if="frequency === 'monthly'">
            {{ formatMonth({ date: new Date(props.transaction.monthFrom), style: 'iso' }) }}
        </td>
        <td v-if="frequency === 'monthly'">
            {{ props.transaction.monthTo ? formatMonth({ date: new Date(props.transaction.monthTo), style: 'iso' }) : '-' }}
        </td>
        <td>
            {{ props.transaction.Transaction.Category.name }}
        </td>
        <td
            data-postive-prefix="+" :class="{ 'dark:text-positive-dark before:content-[attr(data-postive-prefix)] before:relative before:left-[1px]': !props.transaction.Transaction.isExpense }">
            {{ formatCurrency(props.transaction.Transaction.amount) }}
        </td>
        <td class="!py-1 flex msm:col-span-full justify-center msm:justify-end">
            <!-- Disable animation on hiding to avoid unneccessary distractions -->
            <!--<button :class="{ 'child:rotate-180 child:transition-transform child:duration-200': expandEnabled }" @click="toggle(actions.EXPAND)">-->
            <button :class="{ 'child:rotate-180 child:transition-transform child:duration-200': enabledAction === actions.EXPAND }"
                class="child:transition-transform child:duration-200" @click="toggle(actions.EXPAND)">
                <span class="material-symbols-outlined">expand_more</span>
            </button>
            <button @click="toggle(actions.EDIT)">
                <span class="material-symbols-outlined" :class="{ 'material-symbols-filled': enabledAction === actions.EDIT }">edit</span>
            </button>
            <button @click="toggle(actions.DELETE)">
                <span class="material-symbols-outlined" :class="{ 'material-symbols-filled': enabledAction === actions.DELETE }">delete</span>
            </button>
        </td>
        <td class="col-span-full !p-0">
            <ActionContainer :action="enabledAction" :transaction="props.transaction" @done="toggle(null)" />
        </td>
    </tr>
</template>

<style lang="less" scoped>
td {
    @apply p-2 text-ellipsis overflow-hidden whitespace-nowrap text-center;
}


td>button {
    @apply aspect-square grid content-center;

    &:hover {
        @apply bg-tertiary-bg dark:bg-tertiary-bg-dark;
    }

    &>span {
        @apply !text-xl p-1;
    }
}
</style>
