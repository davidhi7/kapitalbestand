<template>
    <!-- TODO outlines -->
    <div class="hover:bg-tertiary-bg">
        <!-- Add a transparent 1px border to match border of input element -->
        <button class="px-2 py-1 border-[1px] border-transparent w-full text-left overflow-hidden text-ellipsis">
            <slot></slot>
        </button>
    </div>
</template>
