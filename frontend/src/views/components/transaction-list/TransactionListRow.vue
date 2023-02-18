<script setup>
import { inject, computed, ref } from 'vue';

import { format_currency as formatCurrency, format_month as formatMonth } from '@/common';
import { ExpandAction, EditAction, DeleteAction } from '.';

const props = defineProps({
    transaction: {
        type: Object,
        required: true
    }
});

const actions = {
    EXPAND: 'ExpandAction',
    EDIT: 'EditAction',
    DELETE: 'DeleteAction'
};
// assigning components directly to the reactive `enabledAction` is discouraged due to possible performance issues
const actionComponents = {
    ExpandAction,
    EditAction,
    DeleteAction
}
let enabledAction = ref(null);
function toggle(action) {
    enabledAction.value = enabledAction.value === action ? null : action;
}
const expandEnabled = computed(() => enabledAction.value === actions.EXPAND);
const editEnabled = computed(() => enabledAction.value === actions.EDIT);
const deleteEnabled = computed(() => enabledAction.value === actions.DELETE)

const frequency = inject('frequency');
</script>

<template>
    <tr class="contents">
        <td v-if="frequency === 'oneoff'">
            {{ props.transaction.date }}
        </td>
        <td v-if="frequency === 'monthly'">
            {{ formatMonth(new Date(props.transaction.monthFrom)) }}
        </td>
        <td v-if="frequency === 'monthly'">
            {{ props.transaction.monthTo ? formatMonth(new Date(props.transaction.monthTo)) : '-' }}
        </td>
        <td>
            {{ props.transaction.Transaction.Category.name }}
        </td>
        <td>
            {{ formatCurrency(props.transaction.Transaction.amount) }}
        </td>
        <td class="!p-0 flex justify-end">
            <button :class="{ 'active': expandEnabled }" class="expand" @click="toggle(actions.EXPAND)">
                <span class="material-symbols-outlined">expand_more</span>
            </button>
            <button :class="{ 'active': editEnabled }" @click="toggle(actions.EDIT)">
                <span class="material-symbols-outlined">edit</span>
            </button>
            <button :class="{ 'active': deleteEnabled }" @click="toggle(actions.DELETE)">
                <span class="material-symbols-outlined">delete</span>
            </button>
        </td>
        <td class="col-span-full" v-if="enabledAction != null">
            <component :is="actionComponents[enabledAction]" :transaction="props.transaction"></component>
        </td>
    </tr>
</template>

<style lang="less" scoped>
tr:nth-child(even) td {
    @apply bg-tertiary-bg dark:bg-tertiary-bg-dark;
}

tr:first-child {
    text-align: left;
}

tr > td:not(:first-child):not(:last-child) {
    text-align: center;
}

td {
    @apply p-3 text-ellipsis;
    /* TODO: research following options */
    @apply overflow-hidden whitespace-nowrap;
}

td > button {
    @apply aspect-square flex-grow;

    &:hover {
        @apply bg-secondary-bg dark:bg-secondary-bg-dark;
    }

    & > span {
        @apply text-xl;
    }

    &.active > span {
        font-variation-settings: 'FILL' 1, 'wght' 300, 'GRAD' 200, 'opsz' 20;
    }

    &.expand > span {
        transition: all .3s;
    }

    &.expand.active > span {
        transform: rotate(180deg);
        transition: all .3s;
    }
}
</style>
