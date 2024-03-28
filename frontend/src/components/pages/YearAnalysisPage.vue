<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>Analyse für Jahr {{ route.params.year }}.</template>
