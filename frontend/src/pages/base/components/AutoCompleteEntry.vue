<template>
    <div class="hover:bg-tertiary-bg last:rounded-b-lg">
        <!-- Add a transparent 1px border to match border of input element -->
        <!-- rounded to have a rounded outline -->
        <button class="px-2 py-1 border-[1px] border-transparent w-full text-left overflow-hidden text-ellipsis rounded-md">
            <slot></slot>
        </button>
    </div>
</template>
