<script setup lang="ts">
import { defineModel, defineProps } from 'vue';

const model = defineModel();
const props = defineProps<{
    suggestions: string[];
}>();
</script>

<template>
    <div>
        <input class="peer" type="text" :model="model" />
        <div class="absolute hidden peer-focus-visible:block bg-black">
            <div class="flex flex-col flex-grow">
                <button v-for="suggestion in [1, 2, 3, 4, 5]">{{ suggestion }}</button>
            </div>
        </div>
    </div>
</template>
