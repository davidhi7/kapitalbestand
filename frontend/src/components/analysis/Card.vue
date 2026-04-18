<script setup>
import PvCard from 'primevue/card';
</script>

<template>
    <PvCard>
        <template #content>
            <slot />
        </template>
    </PvCard>
</template>
