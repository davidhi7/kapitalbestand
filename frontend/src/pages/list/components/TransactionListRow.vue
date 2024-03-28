<script setup>
import { inject, ref } from 'vue';

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
    <tr class="contents child:odd:bg-secondary-bg child:even:bg-main-bg">
        <td v-if="frequency === 'oneoff'">
            {{ props.transaction.date }}
        </td>
        <td v-if="frequency === 'monthly'">
            {{ formatMonth({ date: new Date(props.transaction.monthFrom), style: 'iso' }) }}
        </td>
        <td v-if="frequency === 'monthly'">
            {{
                props.transaction.monthTo
                    ? formatMonth({ date: new Date(props.transaction.monthTo), style: 'iso' })
                    : '-'
            }}
        </td>
        <td>
            {{ props.transaction.Transaction.Category.name }}
        </td>
        <td
            data-postive-prefix="+"
            :class="{
                'text-positive before:relative before:left-[1px] before:content-[attr(data-postive-prefix)]':
                    !props.transaction.Transaction.isExpense
            }"
        >
            {{ formatCurrency(props.transaction.Transaction.amount) }}
        </td>
        <td class="flex justify-center !py-1 msm:col-span-full msm:justify-end">
            <!-- Disable animation on hiding to avoid unneccessary distractions -->
            <!--<button :class="{ 'child:rotate-180 child:transition-transform child:duration-200': expandEnabled }" @click="toggle(actions.EXPAND)">-->
            <button
                :class="{
                    'child:rotate-180 child:transition-transform child:duration-200':
                        enabledAction === actions.EXPAND
                }"
                class="child:transition-transform child:duration-200"
                @click="toggle(actions.EXPAND)"
            >
                <span class="material-symbols-outlined">expand_more</span>
            </button>
            <button @click="toggle(actions.EDIT)">
                <span
                    class="material-symbols-outlined"
                    :class="{ 'material-symbols-filled': enabledAction === actions.EDIT }"
                >
                    edit
                </span>
            </button>
            <button @click="toggle(actions.DELETE)">
                <span
                    class="material-symbols-outlined"
                    :class="{ 'material-symbols-filled': enabledAction === actions.DELETE }"
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
    @apply grid aspect-square content-center;

    &:hover {
        @apply bg-tertiary-bg;
    }

    & > span {
        @apply p-1 !text-xl;
    }
}
</style>
