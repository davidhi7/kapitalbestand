<template>
    <div>
        <slot></slot>
    </div>
</template>

<style scoped>
div {
    @apply grid items-center gap-x-2 gap-y-2;
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
