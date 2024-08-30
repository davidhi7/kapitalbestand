<script setup lang="ts" generic="T extends OneoffTransaction | MonthlyTransaction">
import { ref } from 'vue';

import { MonthlyTransaction, OneoffTransaction } from '@backend-types/TransactionTypes';

import ExpandAction from '@/components/lists/ExpandAction.vue';
import { ColumnSettings } from '@/components/lists/listConfig';
import VerticalSlidingTransition from '@/components/transitions/VerticalSlidingTransition.vue';

const props = defineProps<{
    transaction: T;
    columnSettings: ColumnSettings<T>[];
}>();

const isExpanded = ref(false);

const emit = defineEmits<{
    edit: [];
    delete: [];
}>();
</script>

<template>
    <tr class="contents child:odd:bg-secondary-bg child:even:bg-main-bg">
        <td
            v-for="(column, index) in props.columnSettings"
            :key="index"
            :class="column.style_function ? column.style_function(props.transaction) : ''"
            class="overflow-hidden text-ellipsis whitespace-nowrap px-1 py-2 text-center"
        >
            {{ column.text_function(props.transaction, 'short') }}
        </td>
        <td class="col-span-full flex justify-end !py-1 sm:col-span-1 sm:justify-center">
            <button @click="isExpanded = !isExpanded">
                <span
                    class="material-symbols-outlined transition-transform duration-200"
                    :class="{
                        'rotate-180': isExpanded
                    }"
                >
                    expand_more
                </span>
            </button>
            <button @click="emit('edit')">
                <span class="material-symbols-outlined"> edit </span>
            </button>
            <button @click="emit('delete')">
                <span class="material-symbols-outlined"> delete </span>
            </button>
        </td>
        <td class="col-span-full !p-0">
            <VerticalSlidingTransition
                duration-class="duration-200"
                :render="isExpanded"
                class="mx-4 border-t-[1px] border-tertiary-bg child:my-2"
            >
                <ExpandAction :transaction="props.transaction"> </ExpandAction>
            </VerticalSlidingTransition>
        </td>
    </tr>
</template>

<style scoped>
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
