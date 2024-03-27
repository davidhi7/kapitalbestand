<template>
    <div class="last:rounded-b-lg hover:bg-tertiary-bg">
        <!-- Add a transparent 1px border to match border of input element -->
        <!-- rounded to have a rounded outline -->
        <button
            class="w-full overflow-hidden text-ellipsis rounded-md border-[1px] border-transparent px-2 py-1 text-left"
        >
            <slot></slot>
        </button>
    </div>
</template>
