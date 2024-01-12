<template>
    <div>
        <slot></slot>
    </div>
</template>

<style scoped>
div {
    @apply grid gap-x-2 gap-y-1 items-center;
    grid-template-columns: max-content max-content;

    > :nth-child(even) {
        text-align: left;
    }

    > :nth-child(odd) {
        text-align: right;
        &::after {
            /* tailwind equivalent is `[&>*:nth-child(odd)]:after:content-[':']`, wtf? */
            content: ':';
        }
    }
}
</style>
